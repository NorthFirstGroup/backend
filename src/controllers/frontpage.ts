import { Response, NextFunction } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import getLogger from '../utils/logger';
import responseSend, { initResponseData } from '../utils/serverResponse';
import { dataSource } from '../db/data-source';
import { DbEntity } from '../constants/dbEntity';
import { ActivityStatus } from '../enums/activity';

const logger = getLogger('Frontpage');

export async function getTop(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得清單資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        const tops = await activityRepository.find({
            where: { status: ActivityStatus.Published, is_deleted: false },
            select: ['id', 'name', 'cover_image']
        });

        if (!tops || tops.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, { results: tops }));
    } catch (error) {
        logger.error('getTop 錯誤:', error);
        next(error);
    }
}

export async function getHotTopics(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得清單資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        const topics = await activityRepository
            .createQueryBuilder('activity')
            .leftJoin('activity.category', 'category')
            .where('activity.status = :status', { status: ActivityStatus.Published })
            .andWhere('activity.is_deleted = false')
            .select([
                'activity.id AS id',
                'activity.name AS name',
                'activity.cover_image AS cover_image',
                'activity.start_time AS start_time',
                'activity.end_time AS end_time',
                'category.name AS category' // 取得 category.name 並命名為 category
            ])
            .getRawMany();

        if (!topics || topics.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, { results: topics }));
    } catch (error) {
        logger.error('getHotTopics 錯誤:', error);
        next(error);
    }
}

export async function getNewArrivals(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得清單資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        // 取得全新登場近到遠
        const newArrivals = await activityRepository
            .createQueryBuilder('activity')
            .leftJoin('activity.category', 'category')
            .where('activity.status = :status', { status: ActivityStatus.Published })
            .andWhere('activity.is_deleted = false')
            .orderBy('activity.created_at', 'DESC') // 排序
            .take(10) // 限制筆數
            .select([
                'activity.id AS id',
                'activity.name AS name',
                'activity.cover_image AS cover_image',
                'category.name AS category' // 取得 category.name 並命名為 category
            ])
            .getRawMany();

        if (!newArrivals || newArrivals.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, { results: newArrivals }));
    } catch (error) {
        logger.error('getNewArrivals 錯誤:', error);
        next(error);
    }
}

export async function getLowStock(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得清單資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        const lowStocks = await activityRepository
            .createQueryBuilder('activity')
            .leftJoin('activity.category', 'category')
            .leftJoin('activity.showtimeSections', 'showtimeSection')
            .where('activity.status = :status', { status: ActivityStatus.Published })
            .andWhere('activity.is_deleted = false')
            .select([
                'activity.id AS id',
                'activity.name AS name',
                'activity.cover_image AS cover_image',
                'category.name AS category', // 取得 category.name 並命名為 category
                'activity.start_time AS start_time',
                'activity.end_time AS end_time',
                'showtimeSection.vacancy AS vacancy'
            ])
            .getRawMany();

        if (!lowStocks || lowStocks.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, { results: lowStocks }));
    } catch (error) {
        logger.error('getLowStock 錯誤:', error);
        next(error);
    }
}

export async function getComingSoon(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const SalesInDays = parseInt(req.query.sales_in_days as string) | 3;

        // 取得清單資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        const now = new Date();
        const threeDaysLater = new Date(Date.now() + SalesInDays * 24 * 60 * 60 * 1000); // 三天後的日期

        const comingSoons = await activityRepository
            .createQueryBuilder('activity')
            .leftJoin('activity.category', 'category')
            .where('activity.sales_start_time BETWEEN :now AND :threeDaysLater', {
                now,
                threeDaysLater
            })
            .andWhere('activity.status = :status', { status: ActivityStatus.Published })
            .andWhere('activity.is_deleted = false')
            .orderBy('activity.sales_start_time', 'ASC')
            .select([
                'activity.id AS id',
                'activity.name AS name',
                'activity.cover_image AS cover_image',
                'category.name AS category', // 取得 category.name 並命名為 category
                'activity.sales_start_time AS sales_start_time'
            ])
            .getRawMany();

        if (!comingSoons || comingSoons.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, { results: comingSoons }));
    } catch (error) {
        logger.error('getComingSoon 錯誤:', error);
        next(error);
    }
}
