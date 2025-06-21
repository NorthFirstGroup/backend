import { Response, NextFunction } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { dataSource } from '@db/data-source';
import { DbEntity } from '@constants/dbEntity';
import { getAuthUser } from '@middlewares/auth';
import getLogger from '@utils/logger';
import responseSend, { CustomError, initResponseData, RespStatusCode } from '@utils/serverResponse';
import formidable from 'formidable';
import { uploadPublicImage } from '@utils/uploadFile';
import { ShowtimesEntity } from '@entities/Showtimes';
import { ShowtimeSectionsEntity } from '@entities/ShowtimeSections';
import { ActivityEntity } from '@entities/Activity';
import { ActivitySiteEntity } from '@entities/ActivitySite';
import { OrganizerEntity } from '@entities/Organizer';
import { isNotValidInteger, isNotValidUuid, isValidDateFormat, validator } from '@utils/validation';
import { seatInventoryService } from '@utils/seatInventory';
import { OrderEntity } from '@entities/Order';
import { ActivityStatus } from '@enums/activity';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import 'dayjs/locale/zh-tw';
import { transformAPIKeyToCamel } from '@/utils/APITransformer';
import { AuthRequest } from '@/middlewares/organizer';
import { ActivityTypeEntity } from '@/entities/ActivityType';
import { TicketEntity } from '@/entities/Ticket';
import { TicketStatus } from '@/constants/ticket';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-tw');
const logger = getLogger('Organizer');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true
} as const;
type AllowedMimeTypes = keyof typeof ALLOWED_MIME_TYPES;

export const NON_EDITABLE_ACTIVITY_STATUSES = [ActivityStatus.Cancel, ActivityStatus.Finish, ActivityStatus.OnGoing];

const INVALID_ACTIVITY_STATUS = [ActivityStatus.Cancel, ActivityStatus.Finish];
/**
 * Validate the site information.
 * @param reqBody - The request body containing site information.
 * @returns The validated site information.
 */
interface SiteRequestBody {
    name: string;
    area: string;
    address: string;
    seatingMapUrl: string;
    prices: {
        section: string;
        price: number;
        capacity: number;
    }[];
    [key: string]: unknown;
}

const siteValidator = async (reqBody: SiteRequestBody) => {
    const notValid = validator.requiredFields(reqBody, ['name', 'area', 'address', 'seatingMapUrl', 'prices']);

    if (notValid.length > 0) {
        const field = notValid[0];
        throw new CustomError(RespStatusCode.FIELD_ERROR, `${field} 不得為空`);
    }
    const { name, address, prices, area } = reqBody;

    if (name?.length > 100) {
        throw new CustomError(RespStatusCode.FIELD_ERROR, '場地名稱請限制在100字以內');
    }
    if (address?.length > 100) {
        throw new CustomError(RespStatusCode.FIELD_ERROR, '場地地址請限制在100字以內');
    }

    const areaId = await validator.validArea(area);

    prices.forEach((price: { section: string; price: number; capacity: number }) => {
        if (!price.section || price.section.length > 30) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '分區名稱不得為空且限制在30字以內');
        }
        if (typeof price.price !== 'number' || price.price < 0) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '價格必須為正數');
        }
        if (typeof price.capacity !== 'number' || price.capacity < 0) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '座位數量必須為正數');
        }
    });
    const seatCapacity = reqBody.prices.reduce((acc: number, price: { capacity: number }) => acc + price.capacity, 0);
    return {
        name,
        area_id: areaId,
        address,
        prices,
        seat_capacity: seatCapacity,
        seating_map_url: reqBody.seatingMapUrl
    };
};

export function formatToTaipeiDateTime(dateStr: string): string {
    return dayjs(dateStr).tz('Asia/Taipei').format('YYYY/M/D HH:mm');
}

export async function getProfile(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const organizerRepository = dataSource.getRepository(DbEntity.Organizer);
        const organizer = await organizerRepository.findOne({
            where: { user_id: userId, status: 1, is_deleted: false }
        });
        if (!organizer) {
            responseSend(initResponseData(res, 1019), logger);
            return;
        }

        const responseData = initResponseData(res, 2000);
        responseData.data = organizer;
        responseSend(responseData);
    } catch (error) {
        logger.error(`取得廠商個人資料錯誤：${error}`);
        next(error);
    }
}

export async function putProfile(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const { name, ubn, president, phone, address } = req.body as {
            name: string;
            ubn: string;
            president: string;
            phone: string;
            address: string;
        };

        const organizerRepository = dataSource.getRepository(DbEntity.Organizer);
        const organizer = await organizerRepository.findOne({
            where: { user_id: userId, status: 1, is_deleted: false }
        });

        if (!organizer) {
            responseSend(initResponseData(res, 1019), logger);
            return;
        }

        const result = await organizerRepository.update(organizer.id, {
            name: name,
            ubn: ubn,
            president: president,
            phone: phone,
            address: address
        });

        if (result.affected === 0) {
            responseSend(initResponseData(res, 1002), logger);
            return;
        }

        responseSend(initResponseData(res, 2000));
    } catch (error) {
        logger.error(`更新廠商個人資料錯誤：${error}`);
        next(error);
    }
}

/** 上傳圖片 */
export async function postUploadImage(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const form = formidable({
            multiples: false,
            maxFileSize: MAX_FILE_SIZE,
            allowEmptyFiles: false,
            filter: ({ mimetype }) => {
                if (!mimetype) return false;
                return !!ALLOWED_MIME_TYPES[mimetype as AllowedMimeTypes];
            }
        });

        const [_fields, files] = await form.parse(req);
        const rawFile = files.file;
        const file: formidable.File | undefined = Array.isArray(rawFile) ? rawFile[0] : rawFile;
        if (!file || !file.filepath) {
            logger.error('No file uploaded');
            responseSend(initResponseData(res, 1013), logger);
            return;
        }

        const url = await uploadPublicImage(file);
        responseSend(initResponseData(res, 2000, { url }));
    } catch (error) {
        logger.error('上傳圖片錯誤:', error);
        next(error);
    }
}

// organizer Activity CRUD operations

// 51. 取得廠商活動列表
export async function getActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        console.log('getActivity userId:', req.auth);
        const name = req.query.name;
        const categoryId = parseInt(req.query.category as string) || null;
        const status = parseInt(req.query.status as string) || null;
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 10;
        const qb = dataSource
            .getRepository(ActivityEntity)
            .createQueryBuilder('activity')
            .innerJoin('activity.organizer', 'organizer')
            .leftJoinAndSelect('activity.category', 'category')
            .leftJoinAndSelect('activity.sites', 'sites')
            .where('organizer.user_id = :userId', { userId })
            .andWhere('activity.is_deleted = false');

        // Optional filters
        if (name) {
            qb.andWhere('activity.name ILIKE :name', { name: `%${name}%` });
        }

        if (typeof status === 'number') {
            qb.andWhere('activity.status = :status', { status });
        }

        if (categoryId) {
            qb.andWhere('activity.category_id = :categoryId', { categoryId });
        }

        qb.orderBy('activity.created_at', 'DESC');

        // Pagination
        qb.skip(offset).take(limit);

        const [activities, total_count] = await qb.getManyAndCount();
        const responseData = initResponseData(res, 2000);
        responseData.data = {
            total_count: total_count,
            results: activities
        };
        responseSend(responseData);
    } catch (error) {
        logger.error(`取得廠商活動錯誤：${error}`);
        next(error);
    }
}
// 52. 取得單一活動
export async function getActivityById(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const activityId = parseInt(req.params.activity_id as string) || null;

        console.log(`activityId: ${activityId}`);
        if (!activityId) {
            responseSend(initResponseData(res, 1000), logger);
            return;
        }

        const qb = dataSource
            .getRepository(ActivityEntity)
            .createQueryBuilder('activity')
            .innerJoin('activity.organizer', 'organizer')
            .where('organizer.user_id = :userId', { userId })
            .andWhere('activity.id = :activityId', { activityId })
            .andWhere('activity.is_deleted = false');

        const activity = await qb.getOne();
        if (!activity) {
            return responseSend(initResponseData(res, 1018), logger);
        }

        const responseData = initResponseData(res, 2000);
        responseData.data = {
            ...activity,
            banner_image: activity.banner_image || ''
        };
        responseSend(responseData);
    } catch (error) {
        logger.error(`取得廠商單一活動錯誤：${error}`);
        next(error);
    }
}
// 53. 建立活動
const createActivity = async (req: JWTRequest, res: Response, next: NextFunction) => {
    try {
        const user = getAuthUser(req);
        const reqBody = transformAPIKeyToCamel(req.body);
        const notValid = validator.requiredFields(reqBody, [
            'name',
            'categoryId',
            'description',
            'coverImage',
            'information',
            'salesStartTime',
            'salesEndTime',
            'startTime',
            'endTime'
        ]);

        if (notValid.length > 0) {
            const field = notValid[0];
            throw new CustomError(RespStatusCode.FIELD_ERROR, `${field} 不得為空`);
        }

        if (reqBody.name.length > 100) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '名稱請限制在100字以內');
        }
        if (reqBody.description.length > 500) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '描述請限制在500字以內');
        }

        validator.validTimeFormat(reqBody.salesStartTime, 'sales_start_time');
        validator.validTimeFormat(reqBody.salesEndTime, 'sales_end_time');
        validator.validTimeFormat(reqBody.startTime, 'start_time');
        validator.validTimeFormat(reqBody.endTime, 'end_time');

        // 檢查活動分類是否存在
        const categoryRepo = dataSource.getRepository(ActivityTypeEntity);
        const categoryQ = await categoryRepo.findOneBy({ id: reqBody.categoryId });
        if (!categoryQ) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, `category_id:${reqBody.categoryId} does not exist`);
        }
        const organizer = await user.organizer;
        const activityRepo = dataSource.getRepository(ActivityEntity);

        const newActivity = activityRepo.create({
            organizer: organizer,
            name: reqBody.name,
            category: categoryQ,
            status: ActivityStatus.Draft, // 預設為草稿狀態
            description: reqBody.description,
            information: reqBody.information,
            start_time: reqBody.startTime,
            end_time: reqBody.endTime,
            sales_start_time: reqBody.salesStartTime,
            sales_end_time: reqBody.salesEndTime,
            cover_image: reqBody.coverImage,
            banner_image: reqBody.bannerImage || '',
            tags: reqBody.tags
        });
        const result = await activityRepo.save(newActivity);

        const { category } = result;
        responseSend(
            initResponseData(res, 2000, {
                ...result,
                category: {
                    id: category.id,
                    name: category.name,
                    media: category.media,
                    is_active: category.is_active
                }
            })
        );
    } catch (error) {
        next(error);
    }
};
// 54. 更新活動
const updateActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { activityId } = req.params;
        const user = getAuthUser(req);
        const reqBody = transformAPIKeyToCamel(req.body);
        const notValid = validator.requiredFields(reqBody, [
            'name',
            'categoryId',
            'description',
            'coverImage',
            'information',
            'salesStartTime',
            'salesEndTime',
            'startTime',
            'endTime',
            'status'
        ]);

        if (notValid.length > 0) {
            const field = notValid[0];
            throw new CustomError(RespStatusCode.FIELD_ERROR, `${field} 不得為空`);
        }

        if (reqBody.name.length > 100) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '欄位名稱請限制在100字以內');
        }
        if (reqBody.description.length > 500) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '欄位描述請限制在500字以內');
        }
        validator.validTimeFormat(reqBody.salesStartTime, 'sales_start_time');
        validator.validTimeFormat(reqBody.salesEndTime, 'sales_end_time');
        validator.validTimeFormat(reqBody.startTime, 'start_time');
        validator.validTimeFormat(reqBody.endTime, 'end_time');

        // 檢查活動分類是否存在
        const categoryRepo = dataSource.getRepository(ActivityTypeEntity);
        const categoryQ = await categoryRepo.findOneBy({ id: reqBody.categoryId });
        if (!categoryQ) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, `category_id:${reqBody.categoryId} does not exist`);
        }
        const activityRepo = dataSource.getRepository(ActivityEntity);
        // 取得organizer
        const organizer = await user.organizer;

        console.log(' reqBody', reqBody);
        const result = await activityRepo.update(activityId, {
            organizer: organizer,
            name: reqBody.name,
            category: categoryQ,
            status: reqBody.status,
            description: reqBody.description,
            information: reqBody.information,
            start_time: reqBody.startTime,
            end_time: reqBody.endTime,
            sales_start_time: reqBody.salesStartTime,
            sales_end_time: reqBody.salesEndTime,
            cover_image: reqBody.coverImage,
            banner_image: reqBody.bannerImage || '',
            tags: reqBody.tags
        });
        if (result.affected === 0) {
            throw new CustomError(RespStatusCode.UPDATE_FAILED);
        }
        responseSend(initResponseData(res, 2000));
    } catch (error) {
        next(error);
    }
};
// 55. 刪除活動
const deleteActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { activityId } = req.params;

        const activityRepo = dataSource.getRepository(ActivityEntity);
        if (!req.activity) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }

        const orders = await dataSource
            .getRepository(OrderEntity)
            .createQueryBuilder('order')
            .innerJoinAndSelect('order.showtime', 'showtime')
            .innerJoin('showtime.activity', 'activity')
            .where('activity.id = :activityId', { activityId })
            .getMany();
        if (orders.length > 0) {
            throw new CustomError(RespStatusCode.DELETE_FAILED, '活動已經有訂單，無法刪除');
        }

        const result = await activityRepo.update(activityId, {
            is_deleted: true
        });
        if (result.affected === 0) {
            throw new CustomError(RespStatusCode.DELETE_FAILED);
        }
        responseSend(initResponseData(res, 2000));
    } catch (error) {
        next(error);
    }
};

// organizer Site CRUD operations
// 56. 取得活動場地列表
const getSiteByActivityId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.activity) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }
        const siteRepo = dataSource.getRepository(ActivitySiteEntity);
        const sites = await siteRepo.find({
            where: { activity: { id: req.activity.id } }
        });
        responseSend(initResponseData(res, 2000, sites));
    } catch (error) {
        next(error);
    }
};
// 57. 創建活動場地
const createSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const activityQ = req.activity;
        if (!activityQ) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }
        if (
            activityQ.status === ActivityStatus.Finish ||
            activityQ.status === ActivityStatus.Cancel ||
            activityQ.status === ActivityStatus.OnGoing
        ) {
            throw new CustomError(RespStatusCode.NO_PERMISSION, '活動已開賣/結束/取消，無法變更場地');
        }
        const reqBody = transformAPIKeyToCamel(req.body);
        const validData = await siteValidator(reqBody);

        const siteRepo = dataSource.getRepository(ActivitySiteEntity);
        const newSite = siteRepo.create({
            activity: activityQ,
            ...validData
        });
        const result = await siteRepo.save(newSite);
        responseSend(initResponseData(res, 2000, { activity_id: result.id }));
    } catch (error) {
        next(error);
    }
};
// 58. 更新活動場地
const updateSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { siteId } = req.params;
        if (isNotValidUuid(siteId)) {
            throw new CustomError(RespStatusCode.INVALID_SITE_ID);
        }
        const activityQ = req.activity;
        if (!activityQ) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }
        if (
            activityQ.status === ActivityStatus.Finish ||
            activityQ.status === ActivityStatus.Cancel ||
            activityQ.status === ActivityStatus.OnGoing
        ) {
            throw new CustomError(RespStatusCode.NO_PERMISSION, '活動已開賣/結束/取消，無法變更場地');
        }
        const reqBody = transformAPIKeyToCamel(req.body);
        const validData = await siteValidator(reqBody);

        const siteRepo = dataSource.getRepository(ActivitySiteEntity);
        const siteQ = await siteRepo.findOneBy({
            id: siteId,
            activity_id: activityQ.id
        });
        if (!siteQ) {
            throw new CustomError(RespStatusCode.INVALID_SITE_ID);
        }

        const result = await siteRepo.update(siteId, {
            activity: activityQ,
            ...validData
        });
        if (result.affected === 0) {
            throw new CustomError(RespStatusCode.UPDATE_FAILED);
        }
        responseSend(initResponseData(res, 2000));
    } catch (error) {
        next(error);
    }
};
// 59. 刪除活動場地
const deleteSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { siteId } = req.params;
        if (isNotValidUuid(siteId)) {
            throw new CustomError(RespStatusCode.INVALID_SITE_ID);
        }
        const activityQ = req.activity;
        if (!activityQ) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }
        if (
            activityQ.status === ActivityStatus.Finish ||
            activityQ.status === ActivityStatus.Cancel ||
            activityQ.status === ActivityStatus.OnGoing
        ) {
            throw new CustomError(RespStatusCode.NO_PERMISSION, '活動已開賣/結束/取消，無法變更場地');
        }
        const siteRepo = dataSource.getRepository(ActivitySiteEntity);
        const siteQ = await siteRepo.findOneBy({
            id: siteId,
            activity_id: activityQ.id
        });
        if (!siteQ) {
            throw new CustomError(RespStatusCode.INVALID_SITE_ID);
        }
        await siteRepo.remove(siteQ);
        responseSend(initResponseData(res, 2000));
    } catch (error) {
        next(error);
    }
};

export const organizerActivityCtrl = {
    get: getActivity,
    getById: getActivityById,
    create: createActivity,
    update: updateActivity,
    delete: deleteActivity
};
export const organizerSiteCtrl = {
    getByActivityId: getSiteByActivityId,
    create: createSite,
    update: updateSite,
    delete: deleteSite
};

/* 取得廠商單一活動場次資料 */
// 包含: 演出時間 地點 地址 票價
export async function getActivityShowtimes(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = parseInt(req.params.activity_id, 10);
        const user = getAuthUser(req);
        const userId = user.id;

        // const showtimeRepo = dataSource.getRepository(DbEntity.Showtimes)

        const activityRepo = dataSource.getRepository(ActivityEntity);
        const organizerRepo = dataSource.getRepository(OrganizerEntity);
        // const activity = await activityRepo.findOneBy({ id: Number(activity_id) });
        // 取得活動資料
        const activity = await activityRepo.findOne({
            where: {
                id: activity_id
            }
        });
        // 取得廠商資料
        const organizer = await organizerRepo.findOne({
            where: {
                user_id: userId,
                status: 1,
                is_deleted: false
            },
            relations: {
                user: true // 同時加載 User 資訊
            }
        });

        // 檢查活動是否已建立
        if (!activity) {
            logger.error('無此活動');
            responseSend(initResponseData(res, 3001), logger);
            return;
        }

        if (!organizer || activity.organizer_id !== organizer.id) {
            logger.error('無權限察看或修改該活動');
            responseSend(initResponseData(res, 3003));
            return;
        }

        const showtimes = await dataSource
            .getRepository(ShowtimesEntity)
            .createQueryBuilder('showtime')
            .leftJoinAndSelect('showtime.site', 'site')
            .leftJoinAndSelect('showtime.showtimeSections', 'section')
            .where('showtime.activity_id = :activityId', { activityId: activity_id })
            .orderBy('site.name', 'ASC')
            .addOrderBy('showtime.start_time', 'ASC')
            .getMany();

        // 結構轉換

        const formattedData = showtimes.map(showtime => {
            return {
                id: showtime.id,
                start_time: showtime.start_time,
                site_id: showtime.site.id,
                location: showtime.site.name,
                address: showtime.site.address,
                price: showtime.showtimeSections.map(section => section.price),
                seats: showtime.showtimeSections.map((section: ShowtimeSectionsEntity) => ({
                    id: section.id,
                    section: section.section,
                    price: section.price,
                    capacity: section.capacity,
                    vacancy: section.vacancy
                }))
            };
        });

        responseSend(initResponseData(res, 2000, formattedData));
    } catch (error) {
        logger.error('取得廠商指定活動場次錯誤:', error);
        next(error);
    }
}

// 新增活動場次
export async function postActivityShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = parseInt(req.params.activity_id);
        const { start_at, site_id } = req.body as { site_id: string; start_at: string };
        const user = getAuthUser(req);
        const userId = user.id;

        //
        if (isNotValidInteger(activity_id)) {
            logger.error('活動Id格式錯誤');
            responseSend(initResponseData(res, 1000));
            return;
        }
        // 檢查日期格式
        const format = 'YYYY-MM-DD HH:mm';
        if (!isValidDateFormat(start_at, format)) {
            logger.error('日期時間格式錯誤，請填寫正確的時間');
            responseSend(initResponseData(res, 1010));
            return;
        }

        const newStart = dayjs(start_at, format);
        const newEnd = dayjs(newStart, format).add(3, 'hour'); // 假設每場 3 小時緩衝時間
        const formattedStartTime = newStart.toDate();
        await dataSource.transaction(async manager => {
            // 檢查廠商身分是否正確
            const organizer = await manager.findOne(OrganizerEntity, {
                where: {
                    user_id: userId,
                    status: 1,
                    is_deleted: false
                }
            });

            if (!organizer) {
                logger.error('廠商不存在或尚未通過驗證');
                responseSend(initResponseData(res, 1019));
                return;
            }
            // 檢查活動是否已建立
            const activity = await manager.findOne(ActivityEntity, {
                where: {
                    id: activity_id
                }
            });

            if (!activity) {
                logger.error('無此活動');
                responseSend(initResponseData(res, 3001));
                return;
            }

            if (activity.organizer_id !== organizer.id) {
                logger.error('無權限新增或修改該活動場次');
                responseSend(initResponseData(res, 3003));
                return;
            }

            // 檢查活動場地是否已建立
            const site = await manager.findOne(ActivitySiteEntity, {
                where: { id: site_id }
            });
            if (!site) {
                logger.error('活動場地尚未建立');
                responseSend(initResponseData(res, 3002));
                return;
            }
            // 檢查場地是否為該活動所有
            if (site.activity_id !== activity_id) {
                logger.error('場地無效或與指定的活動不相符');
                responseSend(initResponseData(res, 3005));
                return;
            }

            // 檢查場次時間是否有衝突, 場次的start_at 應介於 avtivity.start_time ~  avtivity.end_time
            if (formattedStartTime < activity.start_time || formattedStartTime > activity.sales_end_time) {
                logger.error('場次開始時間異常');
                responseSend(initResponseData(res, 3006), logger);
                return;
            }

            // 檢查場次的時間地點是否重複
            const showtimeExist = await manager
                .createQueryBuilder(ShowtimesEntity, 'showtime')
                .where('showtime.site_id = :site_id', { site_id })
                .andWhere(`showtime.start_time < :newEnd AND :newStart < showtime.start_time + interval '3 hours'`, {
                    newStart: newStart.toDate(),
                    newEnd: newEnd.toDate()
                })
                .getOne();

            if (showtimeExist) {
                logger.error('該地點與時段已有其他場次，請選擇其他時間');
                responseSend(initResponseData(res, 3007), logger);
                return;
            }

            // 建立場次
            const showtime = manager.create(ShowtimesEntity, {
                activity_id,
                site_id,
                start_time: formattedStartTime,
                seat_image: site.seating_map_url
            });
            await manager.save(showtime);

            // 建立場次區域票價資料
            const sections = site.prices.map(price =>
                manager.create(ShowtimeSectionsEntity, {
                    activity_id,
                    site_id,
                    showtime,
                    section: price.section,
                    price: price.price,
                    capacity: price.capacity,
                    vacancy: price.capacity
                })
            );
            await manager.save(sections);

            const zones = sections.map(section => ({
                section: section.section,
                capacity: section.capacity!
            }));

            try {
                // 將新增場次寫入redis
                await seatInventoryService.initializeActivitySeats(showtime.id, zones);
            } catch (error) {
                logger.warn(`寫入 Redis 失敗，但不影響資料庫：${(error as Error).message}`);
            }
        });

        logger.info('場次建立成功');
        responseSend(initResponseData(res, 2000, undefined, '場次建立成功'));
    } catch (error) {
        logger.error('新增活動場次錯誤:', error);
        next(error);
    }
}

// 更新活動場次
export async function putActivityShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = Number(req.params.activity_id);
        const showtime_id = req.params.showtime_id; // UUID
        const { site_id, start_at } = req.body as { site_id: string; start_at: string };

        const user = getAuthUser(req);
        const userId = user.id;

        const showtimeRepo = dataSource.getRepository(ShowtimesEntity);
        const sectionRepo = dataSource.getRepository(ShowtimeSectionsEntity);

        if (isNotValidInteger(activity_id)) {
            logger.error('活動Id格式錯誤');
            responseSend(initResponseData(res, 1000));
            return;
        }
        // 檢查日期格式
        const format = 'YYYY-MM-DD HH:mm';
        if (!isValidDateFormat(start_at, format)) {
            responseSend(initResponseData(res, 1010));
            return;
        }

        const newStart = dayjs(start_at, format);
        const newEnd = dayjs(newStart, format).add(3, 'hour'); // 假設每場 3 小時緩衝時間
        const formattedStartTime = newStart.toDate();
        await dataSource.transaction(async manager => {
            const organizer = await manager.findOne(OrganizerEntity, {
                where: {
                    user_id: userId,
                    status: 1,
                    is_deleted: false
                }
            });

            if (!organizer) {
                logger.error('廠商不存在或尚未通過驗證');
                responseSend(initResponseData(res, 1019));
                return;
            }

            const activity = await manager.findOne(ActivityEntity, {
                where: {
                    id: activity_id
                }
            });

            if (!activity) {
                logger.error('無此活動');
                responseSend(initResponseData(res, 3001));
                return;
            }

            if (activity.organizer_id !== organizer.id) {
                logger.error('無權限修改該活動');
                responseSend(initResponseData(res, 3003));
                return;
            }
            // 檢查活動場次所屬的活動狀態
            if (NON_EDITABLE_ACTIVITY_STATUSES.includes(activity.status)) {
                logger.error('活動已取消或結束，禁止異動');
                responseSend(initResponseData(res, 3003)); // 活動已取消或結束，禁止異動
            }

            // 檢查場次是否存在
            const showtime = await manager
                .createQueryBuilder(ShowtimesEntity, 'showtime')
                .innerJoin('showtime.activity', 'activity')
                .where('showtime.id = :showtime_id', { showtime_id })
                .andWhere('activity.id = :activity_id', { activity_id })
                .getOne();

            if (!showtime) {
                logger.error('找不到此場次');
                responseSend(initResponseData(res, 3004));
                return;
            }

            // 檢查活動場地是否已建立
            const site = await manager.findOne(ActivitySiteEntity, {
                where: { id: site_id }
            });
            if (!site) {
                logger.error('活動場地尚未建立');
                responseSend(initResponseData(res, 3002));
                return;
            }

            // 檢查場地是否為該活動所有
            if (site.activity_id !== activity_id) {
                logger.error('場地無效或與指定的活動不相符');
                responseSend(initResponseData(res, 3005));
                return;
            }
            // 檢查該場次是否已開放售票
            if (activity.sales_start_time <= new Date()) {
                logger.error('該場次已開放售票，無法修改');
                responseSend(initResponseData(res, 3008));
                return;
            }
            // 檢查是否已有訂單
            const hasOrders = await manager
                .createQueryBuilder(OrderEntity, 'order')
                .where('order.showtime_id = :showtime_id', { showtime_id })
                .getExists();

            if (hasOrders) {
                logger.error('該場次已有成立的訂單，無法修改');
                responseSend(initResponseData(res, 3009)); // 已有訂單，禁止更動
            }

            // 檢查場次時間是否有衝突, 場次的start_at 應介於 avtivity.start_time ~  avtivity.end_time
            if (formattedStartTime < activity.start_time || formattedStartTime > activity.sales_end_time) {
                logger.error('場次開始時間異常');
                responseSend(initResponseData(res, 3006), logger);
                return;
            }

            // 檢查場次的時間地點是否重複, 須排除本場次
            const showtimeExist = await manager
                .createQueryBuilder(ShowtimesEntity, 'showtime')
                .where('showtime.site_id = :site_id', { site_id })
                .andWhere('showtime.id != :showtime_id', { showtime_id }) // 排除目前場次
                .andWhere(`showtime.start_time < :newEnd AND :newStart < showtime.start_time + interval '3 hours'`, {
                    newStart: newStart.toDate(),
                    newEnd: newEnd.toDate()
                })
                .getOne();

            if (showtimeExist) {
                logger.error('該地點與時段已有其他場次，請選擇其他時間');
                responseSend(initResponseData(res, 3007), logger);
                return;
            }

            // 更新場次資料
            showtime.start_time = newStart.toDate();
            showtime.site = site;

            await showtimeRepo.save(showtime);

            // 更新場次區域票價資料
            const sections = site.prices.map(price => {
                const section = new ShowtimeSectionsEntity();
                section.activity_id = activity_id;
                section.site_id = site_id;
                section.showtime_id = showtime_id;
                section.section = price.section;
                section.price = price.price;
                section.capacity = price.capacity;
                section.vacancy = price.capacity;
                return section;
            });

            await sectionRepo.delete({
                activity_id,
                site_id,
                showtime: { id: showtime.id }
            });
            await sectionRepo.save(sections);

            // redis 資料重新初始化
            const zones = sections.map(section => ({
                section: section.section,
                capacity: section.capacity!
            }));
            try {
                // 將新增場次寫入redis
                await seatInventoryService.initializeActivitySeats(showtime.id, zones);
            } catch (error) {
                logger.warn(`寫入 Redis 失敗，但不影響資料庫：${(error as Error).message}`);
            }
        });

        logger.info('活動場次更新成功');
        responseSend(initResponseData(res, 2000, undefined, '活動場次更新成功'));
    } catch (error) {
        logger.error('更新活動場次錯誤:', error);
        next(error);
    }
}

// 刪除活動場次
export async function deleteActivityShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = Number(req.params.activity_id);
        const showtime_id = req.params.showtime_id; // UUID

        const user = getAuthUser(req);
        const userId = user.id;

        // const showtimeRepo = dataSource.getRepository(ShowtimesEntity);
        // const sectionRepo = dataSource.getRepository(ShowtimeSectionsEntity);

        // 檢查型別
        if (isNotValidInteger(activity_id)) {
            logger.error('活動Id格式錯誤');
            responseSend(initResponseData(res, 1000));
            return;
        }

        await dataSource.transaction(async manager => {
            const organizer = await manager.findOne(OrganizerEntity, {
                where: {
                    user_id: userId,
                    status: 1,
                    is_deleted: false
                }
            });

            if (!organizer) {
                logger.error('廠商不存在或尚未通過驗證');
                responseSend(initResponseData(res, 1019));
                return;
            }

            const activity = await manager.findOne(ActivityEntity, {
                where: { id: activity_id }
            });

            if (!activity) {
                logger.error('無此活動');
                responseSend(initResponseData(res, 3001));
                return;
            }
            if (activity.organizer_id !== organizer.id) {
                logger.error('無權限刪除該活動');
                responseSend(initResponseData(res, 3003));
                return;
            }
            // 檢查活動狀態
            if (NON_EDITABLE_ACTIVITY_STATUSES.includes(activity.status)) {
                logger.error('活動狀態為開賣、取消或結束，禁止異動');
                responseSend(initResponseData(res, 3003)); // 活動已取消或結束，禁止異動
            }

            // 檢查是否已有訂單
            const hasOrders = await manager
                .createQueryBuilder(OrderEntity, 'order')
                .where('order.showtime_id = :showtime_id', { showtime_id })
                .getExists();

            if (hasOrders) {
                logger.error('該場次已有成立的訂單，無法修改');
                responseSend(initResponseData(res, 3009)); // 已有訂單，禁止更動
                return;
            }

            const showtime = await manager
                .createQueryBuilder(ShowtimesEntity, 'showtime')
                .innerJoin('showtime.activity', 'activity')
                .where('showtime.id = :showtime_id', { showtime_id })
                .andWhere('activity.id = :activity_id', { activity_id })
                .getOne();

            if (!showtime) {
                logger.error('找不到此場次');
                responseSend(initResponseData(res, 3004));
                return;
            }
            // 刪除活動section
            await manager.delete(ShowtimeSectionsEntity, {
                activity_id,
                showtime: { id: showtime.id }
            });
            // 刪除活動場次
            await manager.delete(ShowtimesEntity, { id: showtime.id });

            try {
                await seatInventoryService.clearActivitySeats(showtime.id);
            } catch (error) {
                logger.warn(`清除 Redis 場次失敗，不影響資料庫：${(error as Error).message}`);
            }
        });

        logger.info('活動場次刪除成功');
        responseSend(initResponseData(res, 2000));
    } catch (error) {
        logger.error('刪除活動場次錯誤:', error);
        next(error);
    }
}

// 取得票券座位資料 (驗證票券資料用)
export async function getTicket(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const ticketId = req.params.ticket_id;
        const user = getAuthUser(req);
        const userId = user.id;

        if (isNotValidUuid(ticketId)) {
            logger.error('票券Id格式錯誤');
            responseSend(initResponseData(res, 1000));
            return;
        }

        const accessCheck = await dataSource
            .getRepository(TicketEntity)
            .createQueryBuilder('ticket')
            .innerJoin('ticket.order', 'order')
            .innerJoin('order.showtime', 'showtime')
            .innerJoin('showtime.activity', 'activity')
            .innerJoin('activity.organizer', 'organizer')
            .innerJoin('organizer.user', 'user')
            .where('ticket.id = :ticketId', { ticketId })
            .andWhere('organizer.user_id = :userId', { userId })
            .getExists();

        if (!accessCheck) {
            logger.error('無權限查看該票券或票券不存在');
            responseSend(initResponseData(res, 1624));
            return;
        }

        const ticket = await dataSource
            .getRepository(TicketEntity)
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.orderTicket', 'orderTicket')
            .leftJoinAndSelect('orderTicket.section', 'section')
            .leftJoinAndSelect('section.showtime', 'showtime')
            .leftJoin('section.site', 'site')
            .leftJoinAndSelect('section.activity', 'activity')
            .leftJoin('activity.organizer', 'organizer')
            .select([
                'ticket.id AS id',
                'activity.name AS activity_name',
                'showtime.id AS showtime_id',
                'showtime.start_time AS start_time',
                'site.name AS location',
                'site.address AS address',
                'organizer.name AS organizer_name',
                'ticket.section AS section',
                'ticket.status AS use_state'
            ])
            .where('ticket.id = :ticketId', { ticketId })
            .getRawOne();

        if (!ticket) {
            logger.error('票券不存在');
            responseSend(initResponseData(res, 1624));
            return;
        }

        const formattedData = {
            id: ticket.id,
            activity_name: ticket.activity_name,
            showtime_id: ticket.showtime_id,
            start_time: formatToTaipeiDateTime(ticket.start_time), // 轉為local time
            location: ticket.location,
            address: ticket.address,
            organizer_name: ticket.organizer_name,
            section: ticket.section,
            use_state: ticket.use_state === 1
        };

        responseSend(initResponseData(res, 2000, formattedData));
    } catch (error) {
        logger.error('取得票券資料錯誤:', error);
        next(error);
    }
}

// 更新票券座位資料 (驗證票券資料用)
export async function putTicket(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const ticketId = req.params.ticket_id;
        const user = getAuthUser(req);
        const userId = user.id;
        const now = dayjs();

        if (isNotValidUuid(ticketId)) {
            logger.error('票券Id格式錯誤');
            responseSend(initResponseData(res, 1000));
            return;
        }
        // 檢查活動票券是否為該廠商所主辦
        const accessCheck = await dataSource
            .getRepository(TicketEntity)
            .createQueryBuilder('ticket')
            .innerJoin('ticket.order', 'order')
            .innerJoin('order.showtime', 'showtime')
            .innerJoin('showtime.activity', 'activity')
            .innerJoin('activity.organizer', 'organizer')
            .innerJoin('organizer.user', 'user')
            .where('ticket.id = :ticketId', { ticketId })
            .andWhere('organizer.user_id = :userId', { userId })
            .getExists();

        if (!accessCheck) {
            logger.error('無權限查看該票券或票券不存在');
            responseSend(initResponseData(res, 1624));
            return;
        }

        // 檢查票券狀態
        const ticket = await dataSource
            .getRepository(TicketEntity)
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.orderTicket', 'orderTicket')
            .leftJoinAndSelect('orderTicket.section', 'section')
            .leftJoinAndSelect('section.showtime', 'showtime')
            .leftJoin('section.site', 'site')
            .leftJoinAndSelect('section.activity', 'activity')
            .leftJoin('activity.organizer', 'organizer')
            .select([
                'ticket.id AS id',
                'activity.status AS activity_status',
                'showtime.start_time AS start_time',
                'site.name AS location',
                'ticket.status AS use_state'
            ])
            .where('ticket.id = :ticketId', { ticketId })
            .getRawOne();

        const start_time = dayjs(ticket.start_time).tz('Asia/Taipei');

        if (!ticket) {
            logger.error('票券不存在');
            responseSend(initResponseData(res, 1624));
            return;
        }
        // 檢查整體活動狀態
        if (INVALID_ACTIVITY_STATUS.includes(ticket.activity_status)) {
            logger.error('活動已取消或結束');
            responseSend(initResponseData(res, 3010));
            return;
        }
        // 檢查使用時間
        if (start_time < now) {
            logger.error('票券已過期');
            responseSend(initResponseData(res, 3006)); // 票券已過期
            return;
        }

        // 檢查票券狀態
        if (ticket.use_status === TicketStatus.Used) {
            logger.error('票券已使用，無法操作');
            responseSend(initResponseData(res, 3011));
            return;
        }
        // 增加檢查票券開放驗證的時間, 暫定抓場次開始時間前1hour
        // if (now.isBefore(start_time.subtract(1, 'hour'))) {
        //     logger.error('尚未到驗證時間或入場時段');
        //     responseSend(initResponseData(res, 3012)); // 尚未到驗證時間
        //     return;
        // }

        const result = await dataSource
            .getRepository(TicketEntity)
            .update({ id: ticketId }, { status: TicketStatus.Used });

        if (result.affected === 0) {
            logger.error('票券更新失敗');
            responseSend(initResponseData(res, 1002));
            return;
        }

        const formattedData = {
            use_state: TicketStatus.Used === 1 ? true : false
        };

        responseSend(initResponseData(res, 2000, formattedData));
    } catch (error) {
        logger.error('更新票券資料錯誤:', error);
        next(error);
    }
}
