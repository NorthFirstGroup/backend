import { Response, NextFunction } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { dataSource } from '../db/data-source';
import { getAuthUser } from '@middlewares/auth';
import getLogger from '@utils/logger';
import responseSend, { CustomError, initResponseData, RespStatusCode } from '@utils/serverResponse';
import formidable from 'formidable';
import { uploadPublicImage } from '@utils/uploadFile';
import { ActivityEntity } from '@entities/Activity';
import { isNotValidUuid, validator } from '@utils/validation';
import { transformAPIKeyToCamel } from '@utils/APITransformer';
import { ActivityStatus } from '@/enums/activity';
import { OrderEntity } from '@entities/Order';
import { AuthRequest } from '@middlewares/organizer';
import { ActivitySiteEntity } from '@entities/ActivitySite';
const logger = getLogger('Organizer');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true
} as const;
type AllowedMimeTypes = keyof typeof ALLOWED_MIME_TYPES;

/**
 * Validate the site information.
 * @param reqBody - The request body containing site information.
 * @returns The validated site information.
 */
const siteValidator = async (reqBody: any) => {
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
        if (!price.section || price.section.length > 50) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, '分區名稱不得為空且限制在20字以內');
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
            ...activity
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
            'bannerImage',
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
        const categoryRepo = dataSource.getRepository('ActivityType');
        const categoryQ = await categoryRepo.findOneBy({ id: reqBody.categoryId });
        if (!categoryQ) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, `category_id:${reqBody.categoryId} does not exist`);
        }
        const organizer = await user.organizer;
        const activityRepo = dataSource.getRepository('Activity');

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
            banner_image: reqBody.bannerImage,
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
            'bannerImage',
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
        const categoryRepo = dataSource.getRepository('ActivityType');
        const categoryQ = await categoryRepo.findOneBy({ id: reqBody.categoryId });
        if (!categoryQ) {
            throw new CustomError(RespStatusCode.FIELD_ERROR, `category_id:${reqBody.categoryId} does not exist`);
        }
        const activityRepo = dataSource.getRepository('Activity');
        // 取得organizer
        const organizer = await user.organizer;
        const result = await activityRepo.update(activityId, {
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
            banner_image: reqBody.bannerImage,
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
    const { activityId } = req.params;

    const activityRepo = dataSource.getRepository('Activity');
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

    await activityRepo.remove(req.activity);
    responseSend(initResponseData(res, 2000));
};

// organizer Site CRUD operations
// 56. 取得活動場地
const getSiteByActivityId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.activity) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }
        const siteRepo = dataSource.getRepository('ActivitySiteEntity');
        const sites = await siteRepo.find({
            where: { activity: { id: req.activity } }
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
        if (activityQ.status === ActivityStatus.Finish || activityQ.status === ActivityStatus.Cancel) {
            throw new CustomError(RespStatusCode.NO_PERMISSION, '活動已經結束或取消，無法變更場地');
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
        if (activityQ.status === ActivityStatus.Finish || activityQ.status === ActivityStatus.Cancel) {
            throw new CustomError(RespStatusCode.NO_PERMISSION, '活動已經結束或取消，無法變更場地');
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
        if (activityQ.status === ActivityStatus.Finish || activityQ.status === ActivityStatus.Cancel) {
            throw new CustomError(RespStatusCode.NO_PERMISSION, '活動已經結束或取消，無法變更場地');
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
