import { Response, NextFunction } from 'express';
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import { isNotValidInteger } from '../utils/validation';
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { getAuthUser } from '../middlewares/auth'
import { ActivityEntity } from '../entities/Activity';
import { ShowtimesEntity } from '../entities/Showtimes';
import { OrderStatus, PaymentMethod, PaymentStatus,PickupStatus, OrderEntity } from '../entities/Order';
import { OrderTicketEntity } from '../entities/OrderTicket';
// import { ActivitySiteEntity } from '../entities/ActivitySite';
// import { OrganizerEntity } from '../entities/Organizer';
// import { ShowtimeSectionsEntity } from '../entities/ShowtimeSections';
import { UserEntity } from '../entities/User';

import { seatInventoryService } from '../utils/seatInventory';

const logger = getLogger('User')

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

// 基於時間產生的訂單編號
function generateOrderNumber(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

//建立訂單
export async function postCreateOrder(req: JWTRequest, res: Response, next: NextFunction) {
    if (!seatInventoryService) {
        logger.error('SeatInventoryService 未初始化！');
        responseSend(initResponseData(res, 5601), logger);
        return;
    }

    let queryRunner;
    const successfullyDeductedTickets: { zone: string; quantity: number }[] = [];
    let parsedActivityId: number | undefined;
    let showtimeId: string | undefined;

    try {
        queryRunner = dataSource.getRepository(ActivityEntity).manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction(); // **開始事務**：確保訂單和訂單票券的資料庫操作原子性

        const { id } = getAuthUser(req)

        const { activity_id, showtime_id, tickets } = req.body as OrderRequestBody;
        showtimeId = showtime_id;

        // 2. Body 驗證
        if (isNotValidInteger(parseInt(activity_id, 10)) || !showtimeId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
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
        }

        // 3. 活動 ID 有效性檢查與狀態判斷
        const activityRepository = queryRunner.manager.getRepository(ActivityEntity);
        const showtimeRepository = queryRunner.manager.getRepository(ShowtimesEntity);

        const activity = await activityRepository.findOne({
            where: { id: parsedActivityId, is_deleted: false },
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

        for (const requestedTicket of tickets) {
            const sectionDetail = showtimeSections.find(section => section.section === requestedTicket.zone);

            if (!sectionDetail) {
                responseSend(initResponseData(res, 1607), logger);
                return;
            }
            // 檢查 price 是否存在且匹配
            if (sectionDetail.price === null || sectionDetail.price === undefined || sectionDetail.price !== requestedTicket.price) {
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
            successfullyDeductedTickets.push({ zone: requestedTicket.zone, quantity: requestedTicket.quantity });

            totalTicketsQuantity += requestedTicket.quantity;
            totalPriceAmount += requestedTicket.price * requestedTicket.quantity;
        }

        // 5. 建立訂單
        const orderRepository = queryRunner.manager.getRepository(OrderEntity);
        const orderTicketRepository = queryRunner.manager.getRepository(OrderTicketEntity);

        const newOrder = new OrderEntity();
        newOrder.user_id = id;
        newOrder.showtime_id = showtimeId;
        newOrder.order_number = generateOrderNumber();
        newOrder.status = OrderStatus.PROCESSING;
        newOrder.total_count = totalTicketsQuantity;
        newOrder.total_price = totalPriceAmount;
        newOrder.payment_method = PaymentMethod.CREDIT_CARD;
        newOrder.payment_status = PaymentStatus.PENDING;
        newOrder.pickup_status = PickupStatus.NOT_PICKED_UP;

        const savedOrder = await orderRepository.save(newOrder);

        const orderTicketsToSave: OrderTicketEntity[] = tickets.map(ticket => {
            const orderTicket = new OrderTicketEntity();
            orderTicket.order_id = savedOrder.id;
            orderTicket.section_id = ticket.zone;
            orderTicket.price = ticket.price;
            orderTicket.quantity = ticket.quantity;
            orderTicket.ticket_type = 1;
            return orderTicket;
        });

        await orderTicketRepository.save(orderTicketsToSave);

        // 如果所有資料庫操作都成功，提交事務(原子操作)
        await queryRunner.commitTransaction();

        // 訂單建立成功
        responseSend(initResponseData(res, 200, {
            message: '訂單成立',
            status: true,
            data: {
                order_id: savedOrder.order_number
            }
        }), logger);

    } catch (error) {
        logger.error('postCreateOrder 錯誤:', error);
        // 如果成功地啟動了資料庫事務，並且這個事務目前還沒被成功提交或回滾，
        // 那麼我就嘗試回滾它，以確保資料庫的數據回到 "錯誤發生前" 的狀態。
        if (queryRunner && queryRunner.isTransactionActive) {
            try {
                await queryRunner.rollbackTransaction();
                logger.info('資料庫事務已回滾。');
            } catch (rollbackError) {
                logger.error(`資料庫事務回滾失敗: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
            }
        }

        if (showtimeId && !isNotValidInteger(parsedActivityId) ) {
            // 將 Redis 中預扣的座位歸還
            for (const deducted of successfullyDeductedTickets) {
                try {
                    await seatInventoryService.returnSeats(showtimeId, deducted.zone, deducted.quantity);
                    logger.info(`錯誤時歸還 Redis 座位：場次 ${showtimeId} 區域 ${deducted.zone} 數量 ${deducted.quantity}`);
                } catch (returnError) {
                    logger.error(`歸還 Redis 座位失敗：${returnError instanceof Error ? returnError.message : String(returnError)}`);
                }
            }
        }

        responseSend(initResponseData(res, 400, {
            message: '訂單失敗',
            status: false,
            data: {}
        }), logger);

        next(error);
    } finally {
        if (queryRunner) {
            try {
                await queryRunner.release();
                logger.info('QueryRunner 已釋放。');
            } catch (releaseError) {
                logger.error(`釋放 QueryRunner 失敗: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`);
            }
        }
    }
}

//取得個人訂單詳細資訊
export async function getOrderDetail(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id:userId } = getAuthUser(req)
        const { order_id } = req.params

        if (isNotValidInteger(order_id)) {
            responseSend(initResponseData(res, 1000), logger);
            return;
        }
        // 取得資料
        const orderRepository = dataSource.getRepository(OrderEntity)

        const order = await orderRepository.findOne({
            where: { id: parseInt(order_id), user_id: userId },
            relations: [
                'showtime',
                'showtime.activity',
                'showtime.site',
                'showtime.site.area',
                'showtime.activity.organizer',
                'orderTickets',
                'tickets',
                'user',
            ],
        })

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
            status: ticket.status === 0 ? '未使用' : '已使用', // Assuming 0 for unused, 1 for used
            seatNumber: ticket.section,
            certificateUrl: ticket.certificate_url,
        }))

        const responseData = initResponseData(res, 2000)
        responseData.data = {
            orderId: order.order_number,
            eventName: order.showtime.activity.name,
            eventDate: `${order.showtime.start_time.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${order.showtime.start_time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
            location: `${order.showtime.site.name} / ${order.showtime.site.address}`,
            organizer: order.showtime.activity.organizer.name,
            ticketType: '電子票券', // As per OrderTicketEntity, ticket_type default is 1 (electronic ticket)
            ticketCount: order.total_count,
            totalPrice: parseFloat(order.total_price.toString()),
            paymentMethod: order.payment_method === PaymentMethod.CREDIT_CARD ? '信用卡' : order.payment_method, // Mapping PaymentMethod enum to display string
            seats: seats,
            contact: {
                name: user.nick_name,
                phone: user.phone,
                email: user.email,
            },
        }

        responseSend(responseData)
    } catch (error) {
        logger.error('取得個人訂單詳細資訊錯誤', error)
        next(error)
    }
}

interface OrderListItem {
    orderId: string;
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
        status: string;
        seatNumber: string;
        certificateUrl: string;
    }[];
}

//取得個人訂單資訊列表
export async function getUserOrders(req: JWTRequest, res: Response, next: NextFunction) {
    try {

        const { id: userId } = getAuthUser(req)
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.page_size as string) || 10;
        const sortBy = (req.query.sort_by as string) || 'eventDate'; // 預設排序欄位
        const order = (req.query.order as string) || 'desc'; // 預設排序順序，新時間排前面

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
        const queryBuilder = orderRepository.createQueryBuilder('order')
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
            const paymentStatusMap: { [key in PaymentStatus]: string } = {
                [PaymentStatus.PENDING]: '待付款',
                [PaymentStatus.PAID]: '已付款',
                [PaymentStatus.FAILED]: '支付失敗',
                [PaymentStatus.REFUNDED]: '已退款',
                [PaymentStatus.EXPIRED]: '支付超時',
                [PaymentStatus.CANCELLED]: '支付取消',
            };

            const seats = order.tickets.map(ticket => ({
                status: ticket.status === 0 ? '未使用' : '已使用', // Assuming 0 for unused, 1 for used [cite: 111]
                seatNumber: ticket.section, // [cite: 110]
                certificateUrl: ticket.certificate_url, // [cite: 111]
            }));

            return {
                orderId: order.order_number,
                eventName: order.showtime.activity.name,
                eventDate: `${order.showtime.start_time.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${order.showtime.start_time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                location: `${order.showtime.site.name} / ${order.showtime.site.address}`,
                organizer: order.showtime.activity.organizer.name,
                status: paymentStatusMap[order.payment_status],
                ticketType: ticketType,
                ticketCount: order.total_count,
                totalPrice: parseFloat(order.total_price.toString()),
                coverImage: order.showtime.activity.cover_image,
                seats: seats,
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
                limit: pageSize,
            }
        }

        responseSend(responseData);

    } catch (error) {
        logger.error('取得個人訂單資訊列表錯誤', error)
        next(error)
    }
}