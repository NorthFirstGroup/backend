import { Response, NextFunction } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { dataSource } from '../db/data-source';
import { isNotValidInteger, isNotValidUuid } from '../utils/validation';
import getLogger from '../utils/logger';
import responseSend, { initResponseData } from '../utils/serverResponse';
import { getAuthUser } from '../middlewares/auth';
import { ActivityEntity } from '../entities/Activity';
import { ShowtimesEntity } from '../entities/Showtimes';
import { OrderStatus, PaymentMethod, PaymentStatus, PickupStatus, OrderEntity } from '../entities/Order';
import { OrderTicketEntity } from '../entities/OrderTicket';
// import { ActivitySiteEntity } from '../entities/ActivitySite';
// import { OrganizerEntity } from '../entities/Organizer';
import { ShowtimeSectionsEntity } from '../entities/ShowtimeSections';
import { UserEntity } from '../entities/User';
import { TicketEntity } from '../entities/Ticket';
import { DailySequenceEntity } from '../entities/DailySequence';

import { seatInventoryService } from '../utils/seatInventory';

const logger = getLogger('User');

// 票券介面
interface TicketInput {
    zone: string;
    price: number;
    quantity: number;
}

// 訂單請求 Body 介面
interface OrderRequestBody {
    activity_id: string;
    showtime_id: string; // 場次 ID (UUID)
    tickets: TicketInput[];
}

const paymentStatusMap: { [key in PaymentStatus]: string } = {
    [PaymentStatus.PENDING]: '待付款',
    [PaymentStatus.PAID]: '已付款',
    [PaymentStatus.FAILED]: '支付失敗',
    [PaymentStatus.REFUNDED]: '已退款',
    [PaymentStatus.EXPIRED]: '支付超時',
    [PaymentStatus.CANCELLED]: '支付取消'
};

function validateOrderNumber(orderNumber: string): boolean {
    // 1. Check total length and format
    if (!/^\d{13}$/.test(orderNumber)) {
        // YYYYMMDD (8 digits) + SSSSS (5 digits) = 13 digits
        return false; // 必須是 13 位數字
    }

    const datePart = orderNumber.substring(0, 8); // YYYYMMDD
    const sequentialNumberPart = orderNumber.substring(8, 13); // SSSSS

    const year = parseInt(datePart.substring(0, 4), 10);
    const month = parseInt(datePart.substring(4, 6), 10);
    const day = parseInt(datePart.substring(6, 8), 10);

    // 基本日期驗證 (month 1-12, day based on month)
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        // Basic check, more robust date validation can be added
        return false;
    }

    // 獲取當前日期，並計算時間邊界 (3 個月前到 6 個月後)
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    threeMonthsAgo.setDate(1); // Set to the first day of the month for consistent comparison

    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(now.getMonth() + 6);
    sixMonthsLater.setDate(1); // Set to the first day of the month for consistent comparison

    // For comparison, we only care about the year and month part of the order date
    // and the month boundaries. So, set orderDate to the first day of its month.
    const orderMonthStart = new Date(year, month - 1, 1);

    // 檢查訂單編號的月份是否在有效範圍內
    if (orderMonthStart < threeMonthsAgo || orderMonthStart > sixMonthsLater) {
        return false; // 訂單日期超出有效時間範圍
    }

    if (parseInt(sequentialNumberPart) < 1) return false;

    return true; // All checks passed
}

//建立訂單
export async function postCreateOrder(req: JWTRequest, res: Response, next: NextFunction) {
    if (!seatInventoryService) {
        logger.error('SeatInventoryService 未初始化！');
        responseSend(initResponseData(res, 5601), logger);
        return;
    }

    let queryRunner;
    const successfullyDeductedTickets: { zone: string; quantity: number; sectionDetail: ShowtimeSectionsEntity }[] = [];
    let parsedActivityId: number | undefined;
    let showtimeId: string | undefined;

    try {
        queryRunner = dataSource.getRepository(ActivityEntity).manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction(); // **開始事務**：確保訂單和訂單票券的資料庫操作原子性

        const { id } = getAuthUser(req);

        const { activity_id, showtime_id, tickets } = req.body as OrderRequestBody;
        showtimeId = showtime_id;

        // 2. Body 驗證
        if (
            isNotValidInteger(parseInt(activity_id, 10)) ||
            !showtimeId ||
            !tickets ||
            !Array.isArray(tickets) ||
            tickets.length === 0
        ) {
            responseSend(initResponseData(res, 1000), logger);
            return;
        }
        parsedActivityId = parseInt(activity_id, 10);

        if (tickets.length > 4) {
            responseSend(initResponseData(res, 1601), logger);
            return;
        }

        // 檢查每筆票券的格式
        for (const ticket of tickets) {
            if (!ticket.zone || isNotValidInteger(ticket.price) || isNotValidInteger(ticket.quantity)) {
                responseSend(initResponseData(res, 1602), logger);
                return;
            }
            if (ticket.quantity > 4) {
                responseSend(initResponseData(res, 1611), logger);
                return;
            }
        }

        // 3. 活動 ID 有效性檢查與狀態判斷
        const activityRepository = queryRunner.manager.getRepository(ActivityEntity);
        const showtimeRepository = queryRunner.manager.getRepository(ShowtimesEntity);
        const showtimeSectionRepository = queryRunner.manager.getRepository(ShowtimeSectionsEntity); // Get repository for ShowtimeSections
        const dailySequenceRepository = queryRunner.manager.getRepository(DailySequenceEntity); // <--- NEW

        const activity = await activityRepository.findOne({
            where: { id: parsedActivityId, is_deleted: false }
        });

        if (!activity) {
            responseSend(initResponseData(res, 1603), logger);
            return;
        }

        //活動場次有效性
        const showtime = await showtimeRepository.findOne({
            where: { id: showtimeId, activity_id: parsedActivityId },
            relations: ['showtimeSections']
        });

        if (!showtime) {
            responseSend(initResponseData(res, 1604), logger);
            return;
        }
        if (!showtime.showtimeSections || showtime.showtimeSections.length === 0) {
            responseSend(initResponseData(res, 1605), logger);
            return;
        }

        // 檢查活動是否在開賣中
        const now = new Date();
        if (now < activity.sales_start_time || now > activity.sales_end_time) {
            responseSend(initResponseData(res, 1606), logger);
            return;
        }

        // 4. 座位庫存判斷
        const showtimeSections = showtime.showtimeSections;
        let totalTicketsQuantity = 0; // 用於計算 total_count
        let totalPriceAmount = 0; // 用於計算 total_price
        const orderTicketsDetails: { sectionId: string; price: number; quantity: number }[] = []; // To store sectionId for OrderTicketEntity

        for (const requestedTicket of tickets) {
            const sectionDetail = showtimeSections.find(section => section.section === requestedTicket.zone);

            if (!sectionDetail) {
                responseSend(initResponseData(res, 1607), logger);
                return;
            }
            // 檢查 price 是否存在且匹配
            if (
                sectionDetail.price === null ||
                sectionDetail.price === undefined ||
                sectionDetail.price !== requestedTicket.price
            ) {
                responseSend(initResponseData(res, 1608), logger);
                return;
            }

            // 實際的座位庫存檢查和鎖定。
            const deductedSuccessfully = await seatInventoryService.deductSeats(
                showtimeId,
                requestedTicket.zone,
                requestedTicket.quantity
            );

            if (!deductedSuccessfully) {
                responseSend(initResponseData(res, 1609), logger);
                return;
            }

            // 記錄成功預扣的票券
            successfullyDeductedTickets.push({
                zone: requestedTicket.zone,
                quantity: requestedTicket.quantity,
                sectionDetail: sectionDetail
            });

            totalTicketsQuantity += requestedTicket.quantity;
            totalPriceAmount += requestedTicket.price * requestedTicket.quantity;

            // Store the section's ID for creating OrderTicketEntity
            orderTicketsDetails.push({
                sectionId: sectionDetail.id, // Use the ID of the ShowtimeSectionEntity
                price: requestedTicket.price,
                quantity: requestedTicket.quantity
            });
        }

        //showtimeSectionRepository 也要預扣
        for (const deducted of successfullyDeductedTickets) {
            // Ensure sectionDetail.vacancy is not null or undefined before subtraction
            if (deducted.sectionDetail.vacancy === null || deducted.sectionDetail.vacancy === undefined) {
                logger.error(`ShowtimeSection ${deducted.sectionDetail.id} 的 vacancy 為 null 或 undefined。`);
                // Decide how to handle this error. For now, we'll let it proceed if it's just a warning.
                // You might want to rollback and return an error here.
                responseSend(initResponseData(res, 5602), logger);
                throw new Error('Seat vacancy data is missing.'); // Throw to trigger rollback
            }
            deducted.sectionDetail.vacancy -= deducted.quantity;
            await showtimeSectionRepository.save(deducted.sectionDetail);
            logger.info(
                `更新 ShowtimeSections vacancy for ID ${deducted.sectionDetail.id}: 新值 ${deducted.sectionDetail.vacancy}`
            );
        }

        // 5. 更新訂單編號
        const orderDate = new Date();
        const year = orderDate.getFullYear();
        const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
        const day = orderDate.getDate().toString().padStart(2, '0');
        const yearMonthDay = `${year}${month}${day}`;

        // Attempt to find the daily sequence with pessimistic write lock
        let dailySequence = await dailySequenceRepository.findOne({
            where: { date_key: yearMonthDay },
            lock: { mode: 'pessimistic_write' } // Locks the row for the duration of the transaction
        });

        if (!dailySequence) {
            // If no sequence exists for today, create a new one
            dailySequence = dailySequenceRepository.create({
                date_key: yearMonthDay,
                sequence: 0 // Will be incremented to 1 for the first order
            });
        }

        dailySequence.sequence += 1; // Increment the sequence
        await dailySequenceRepository.save(dailySequence); // Save the updated sequence within the transaction

        const paddedSequence = dailySequence.sequence.toString().padStart(5, '0');
        const newOrderNumber = `${yearMonthDay}${paddedSequence}`;
        logger.info(`Generated order number: ${newOrderNumber}`); // Log the generated order number

        // 5. 建立訂單
        const orderRepository = queryRunner.manager.getRepository(OrderEntity);
        const orderTicketRepository = queryRunner.manager.getRepository(OrderTicketEntity);
        const ticketRepository = queryRunner.manager.getRepository(TicketEntity);

        const newOrder = new OrderEntity();
        newOrder.user_id = id;
        newOrder.showtime_id = showtimeId;
        newOrder.order_number = newOrderNumber;
        newOrder.status = OrderStatus.PROCESSING;
        newOrder.total_count = totalTicketsQuantity;
        newOrder.total_price = totalPriceAmount;
        newOrder.payment_method = PaymentMethod.CREDIT_CARD;
        newOrder.payment_status = PaymentStatus.PENDING;
        newOrder.pickup_status = PickupStatus.NOT_PICKED_UP;

        const savedOrder = await orderRepository.save(newOrder);
        logger.info(`saved orderRepository ${savedOrder.id}`);

        const orderTicketsToSave: OrderTicketEntity[] = orderTicketsDetails.map(detail => {
            const orderTicket = new OrderTicketEntity();
            orderTicket.order_id = savedOrder.id;
            orderTicket.section_id = detail.sectionId;
            orderTicket.price = detail.price;
            orderTicket.quantity = detail.quantity;
            orderTicket.ticket_type = 1; // 預設電子票券
            return orderTicket;
        });

        // console.log(JSON.stringify(orderTicketsToSave));

        const savedOrderTickets = await orderTicketRepository.save(orderTicketsToSave); // 批次儲存所有訂單票券
        logger.info(`saved orderTicketRepository: ${savedOrderTickets.length} entries created.`);

        const ticketsToSave: TicketEntity[] = [];
        for (const savedOrderTicket of savedOrderTickets) {
            const sectionDetail = successfullyDeductedTickets.find(
                deducted => deducted.sectionDetail.id === savedOrderTicket.section_id
            )?.sectionDetail;

            if (!sectionDetail) {
                logger.error(`找不到對應的 ShowtimeSectionEntity for section_id: ${savedOrderTicket.section_id}`);
                throw new Error('Associated section detail not found for order ticket.');
            }

            for (let i = 0; i < savedOrderTicket.quantity; i++) {
                const ticket = new TicketEntity();
                ticket.order_id = savedOrder.id;
                ticket.order_ticket_id = savedOrderTicket.id;
                ticket.order_number = newOrderNumber;
                ticket.section = sectionDetail.section;
                ticket.price = sectionDetail.price!;
                // 生成唯一的票券代碼
                ticket.ticket_code = `${newOrderNumber}-${sectionDetail.section}-${i + 1}`;
                ticket.status = 0; // 預設為未使用
                // 生成電子憑證連結
                //ticket.certificate_url = `https://your-ticket-platform.com/certificate/${ticket.ticket_code}`;
                ticket.certificate_url = '';
                ticketsToSave.push(ticket);
            }
        }

        await ticketRepository.save(ticketsToSave); // 批次儲存所有單張票券
        logger.info(`saved ticketRepository: ${ticketsToSave.length} tickets created.`);

        // 如果所有資料庫操作都成功，提交事務(原子操作)
        await queryRunner.commitTransaction();
        // logger.info(`commitTransaction`)

        // 訂單建立成功
        responseSend(
            initResponseData(res, 2000, {
                order_number: savedOrder.order_number
                // order_id: savedOrder.id
            }),
            logger
        );
    } catch (error) {
        logger.error('postCreateOrder 錯誤:');
        // --- NEW/MODIFIED LOGGING ---
        if (error instanceof Error) {
            logger.error(`Error Message: ${error.message}`);
            logger.error(`Error Name: ${error.name}`);
            logger.error(`Error Stack: ${error.stack}`);
        } else {
            logger.error(`Unknown Error Type: ${JSON.stringify(error)}`); // Fallback for non-Error objects
        }
        // 如果成功地啟動了資料庫事務，並且這個事務目前還沒被成功提交或回滾，
        // 那麼我就嘗試回滾它，以確保資料庫的數據回到 "錯誤發生前" 的狀態。
        if (queryRunner && queryRunner.isTransactionActive) {
            try {
                await queryRunner.rollbackTransaction();
                logger.info('資料庫事務已回滾。');

                // 重要：所有在 `startTransaction` 和 `commitTransaction` 之間的 `queryRunner.manager.save()`
                // (包括透過 showtimeSectionRepository.save() 進行的 vacancy 更新)
                // 都會被此 rollback 操作自動回滾。因此，不需要在這裡對資料庫進行額外的回滾操作。
                for (const deducted of successfullyDeductedTickets) {
                    if (deducted.sectionDetail.vacancy !== null && deducted.sectionDetail.vacancy !== undefined) {
                        deducted.sectionDetail.vacancy += deducted.quantity;
                        logger.info(
                            `由於回滾，理論上會自動恢復 ShowtimeSections vacancy for ID ${deducted.sectionDetail.id}`
                        );
                    }
                }
            } catch (rollbackError) {
                logger.error(
                    `資料庫事務回滾失敗: ${
                        rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
                    }`
                );
            }
        }

        if (showtimeId && !isNotValidInteger(parsedActivityId)) {
            // 將 Redis 中預扣的座位歸還
            for (const deducted of successfullyDeductedTickets) {
                try {
                    await seatInventoryService.returnSeats(showtimeId, deducted.zone, deducted.quantity);
                    logger.info(
                        `錯誤時歸還 Redis 座位：場次 ${showtimeId} 區域 ${deducted.zone} 數量 ${deducted.quantity}`
                    );
                } catch (returnError) {
                    logger.error(
                        `歸還 Redis 座位失敗：${
                            returnError instanceof Error ? returnError.message : String(returnError)
                        }`
                    );
                }
            }
        }

        responseSend(
            initResponseData(res, 1610, {
                data: {}
            }),
            logger
        );

        logger.error('建立訂單失敗', error);
        next(error);
    } finally {
        if (queryRunner) {
            try {
                await queryRunner.release();
                logger.info('QueryRunner 已釋放。');
            } catch (releaseError) {
                logger.error(
                    `釋放 QueryRunner 失敗: ${
                        releaseError instanceof Error ? releaseError.message : String(releaseError)
                    }`
                );
            }
        }
    }
}

//取得個人訂單詳細資訊
export async function getOrderDetail(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const { order_number } = req.params;

        if (typeof order_number !== 'string' || order_number.length === 0 || !validateOrderNumber(order_number)) {
            responseSend(initResponseData(res, 1000), logger);
            return;
        }

        // 取得資料
        const orderRepository = dataSource.getRepository(OrderEntity);

        const order = await orderRepository.findOne({
            where: { order_number: order_number, user_id: userId },
            relations: [
                'showtime',
                'showtime.activity',
                'showtime.site',
                'showtime.site.area',
                'showtime.activity.organizer',
                'orderTickets',
                'tickets',
                'user'
            ]
        });

        if (!order) {
            responseSend(initResponseData(res, 1620), logger);
            return;
        }

        // Fetch contact information from the UserEntity
        const user = await dataSource.getRepository(UserEntity).findOne({
            where: { id: userId }
        });

        if (!user) {
            responseSend(initResponseData(res, 1621), logger);
            return;
        }

        const seats = order.tickets.map(ticket => ({
            id: ticket.id,
            status: ticket.status === 0 ? '未使用' : '已使用', // Assuming 0 for unused, 1 for used
            seatNumber: ticket.section,
            certificateUrl: ticket.certificate_url
        }));

        const responseData = initResponseData(res, 2000);
        responseData.data = {
            // orderId: order_id,
            orderNumber: order.order_number,
            eventName: order.showtime.activity.name,
            eventDate: `${order.showtime.start_time.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })} ${order.showtime.start_time.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`,
            location: `${order.showtime.site.name} / ${order.showtime.site.address}`,
            organizer: order.showtime.activity.organizer.name,
            status: paymentStatusMap[order.payment_status],
            ticketType: '電子票券', // As per OrderTicketEntity, ticket_type default is 1 (electronic ticket)
            ticketCount: order.total_count,
            totalPrice: parseFloat(order.total_price.toString()),
            paymentMethod: order.payment_method === PaymentMethod.CREDIT_CARD ? '信用卡' : order.payment_method, // Mapping PaymentMethod enum to display string
            seats: seats,
            contact: {
                name: user.nick_name,
                phone: user.phone,
                email: user.email
            }
        };

        responseSend(responseData);
    } catch (error) {
        logger.error('取得個人訂單詳細資訊錯誤', error);
        next(error);
    }
}

interface OrderListItem {
    // orderId: number;
    orderNumber: string;
    eventName: string;
    eventDate: string;
    location: string;
    organizer: string;
    status: string;
    ticketType: string;
    ticketCount: number;
    totalPrice: number;
    coverImage: string;
    seats: {
        id: string;
        status: string;
        seatNumber: string;
        certificateUrl: string;
    }[];
}

//取得個人訂單資訊列表
export async function getUserOrders(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.page_size as string) || 10;
        const sortBy = (req.query.sort_by as string) || 'eventDate'; // 預設排序欄位
        const order = (req.query.order as string) || 'desc'; // 預設排序順序，新時間排前面

        //fix later: 考慮改用時間來限制，如最舊時間為 3 個月前
        if (isNotValidInteger(page) || isNotValidInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 10) {
            responseSend(initResponseData(res, 1000), logger);
            return;
        }
        //目前 api 設計並未輸入 sortBy, order
        const allowedSortBy = ['eventDate', 'created_at', 'total_price']; // 允許排序的欄位
        if (!allowedSortBy.includes(sortBy)) {
            responseSend(initResponseData(res, 1622), logger);
            return;
        }

        const allowedOrder = ['asc', 'desc'];
        if (!allowedOrder.includes(order.toLowerCase())) {
            responseSend(initResponseData(res, 1623), logger);
            return;
        }

        const orderRepository = dataSource.getRepository(OrderEntity);

        // 構建查詢
        const queryBuilder = orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.showtime', 'showtime') // 關聯場次
            .leftJoinAndSelect('showtime.activity', 'activity') // 關聯活動
            .leftJoinAndSelect('showtime.site', 'site') // 關聯場地
            .leftJoinAndSelect('site.area', 'area') // 關聯區域
            .leftJoinAndSelect('activity.organizer', 'organizer') // 關聯主辦方
            .leftJoinAndSelect('order.tickets', 'ticket') // 關聯票券
            .where('order.user_id = :userId', { userId }) // 過濾當前用戶的訂單
            .orderBy(
                sortBy === 'eventDate' ? 'showtime.start_time' : `order.${sortBy}`, // 根據 sortBy 判斷排序欄位
                order.toUpperCase() as 'ASC' | 'DESC' // 確保是大寫 'ASC' 或 'DESC'
            )
            .skip((page - 1) * pageSize) // 跳過前幾頁的資料
            .take(pageSize); // 取得當前頁的資料量

        const [orders, total] = await queryBuilder.getManyAndCount();

        const formattedOrders: OrderListItem[] = orders.map(order => {
            const ticketType = '電子票券'; // 根據 OrderTicketEntity 的預設值 [cite: 65]

            const seats = order.tickets.map(ticket => ({
                id: ticket.id,
                status: ticket.status === 0 ? '未使用' : '已使用', // Assuming 0 for unused, 1 for used [cite: 111]
                seatNumber: ticket.section, // [cite: 110]
                certificateUrl: ticket.certificate_url // [cite: 111]
            }));

            return {
                // orderId: order.id,
                orderNumber: order.order_number,
                eventName: order.showtime.activity.name,
                eventDate: `${order.showtime.start_time.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                })} ${order.showtime.start_time.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}`,
                location: `${order.showtime.site.name} / ${order.showtime.site.address}`,
                organizer: order.showtime.activity.organizer.name,
                status: paymentStatusMap[order.payment_status],
                ticketType: ticketType,
                ticketCount: order.total_count,
                totalPrice: parseFloat(order.total_price.toString()),
                coverImage: order.showtime.activity.cover_image,
                seats: seats
            };
        });

        const responseData = initResponseData(res, 2000);
        responseData.data = {
            sort_by: sortBy,
            order: order,
            results: formattedOrders,
            pagination: {
                total: total,
                page: page,
                limit: pageSize
            }
        };

        responseSend(responseData);
    } catch (error) {
        logger.error('取得個人訂單資訊列表錯誤', error);
        next(error);
    }
}

//取得票券詳細資訊
export async function getTicketDetail(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const { ticket_id } = req.params;

        if (isNotValidUuid(ticket_id)) {
            responseSend(initResponseData(res, 1000), logger);
            return;
        }

        const ticketRepository = dataSource.getRepository(TicketEntity);

        const ticket = await ticketRepository.findOne({
            where: {
                id: ticket_id,
                order: {
                    user_id: userId
                }
            },
            relations: [
                'order',
                'order.showtime',
                'order.showtime.activity',
                'order.showtime.site',
                'order.showtime.activity.organizer',
                'orderTicket'
            ]
        });

        if (!ticket) {
            responseSend(initResponseData(res, 1624), logger);
            return;
        }

        const ticketStatusMap: { [key: number]: string } = {
            0: '未使用',
            1: '已使用',
            2: '已失效' // 假設 2 代表失效
        };
        const ticketStatus = ticketStatusMap[ticket.status] || '未知狀態';

        // 票券類型轉換 (根據 OrderTicketEntity 中的 ticket_type 欄位)
        const ticketTypeMap: { [key: number]: string } = {
            1: '電子票券',
            2: '實體票券' // 假設 2 代表實體票券
        };
        const ticketType = ticketTypeMap[ticket.orderTicket.ticket_type] || '未知類型';

        const formattedTicketDetail = {
            ticket_code: ticket.ticket_code,
            eventName: ticket.order.showtime.activity.name,
            eventDate: new Date(ticket.order.showtime.start_time)
                .toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false // 24小時制
                })
                .replace(/\//g, '/'), // 格式化為 "YYYY/MM/DD HH:MM"
            location: `${ticket.order.showtime.site.name} / ${ticket.order.showtime.site.address}`,
            organizer: ticket.order.showtime.activity.organizer.name,
            status: ticketStatus,
            ticketType: ticketType,
            seats: ticket.section
        };

        const responseData = initResponseData(res, 2000);
        responseData.data = formattedTicketDetail;

        responseSend(responseData);
    } catch (error) {
        logger.error(`取得票券詳細資訊錯誤`, error);
        next(error);
    }
}
