import { Response, NextFunction } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import getLogger from '../utils/logger';
import responseSend, { initResponseData } from '../utils/serverResponse';
import { DbEntity } from '../constants/dbEntity';
import { ActivityEntity } from '../entities/Activity';
import { ActivityTypeEntity } from '../entities/ActivityType';
import { dataSource } from '../db/data-source';
import { ShowtimeSectionsEntity } from '../entities/ShowtimeSections';
import { ActivityStatus } from '../enums/activity';
import dayjs from 'dayjs';

const logger = getLogger('Activity');

export async function getCategory(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const qb = dataSource
            .getRepository(ActivityTypeEntity)
            .createQueryBuilder('category')
            .orderBy('category.id', 'ASC');

        const [results, total_count] = await qb.getManyAndCount();
        const responseData = initResponseData(res, 2000);
        responseData.data = {
            total_count: total_count,
            results: results
        };
        responseSend(responseData);
    } catch (error) {
        logger.error('getActivity 錯誤', error);
        next(error);
    }
}

export async function getActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { activity_id } = req.params;
        // 取得資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        const activity = await activityRepository
            .createQueryBuilder('activity')
            .leftJoin('activity.category', 'category')
            .where('activity.id = :id', { id: activity_id })
            .andWhere('activity.status = :status', { status: ActivityStatus.Published })
            .select([
                'activity.id AS id',
                'activity.name AS name',
                'activity.cover_image AS cover_image',
                'activity.description AS description',
                'activity.information AS information',
                'category.name AS category' // 取得 category.name 並命名為 category
            ])
            .getRawOne();

        if (!activity) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, activity));
    } catch (error) {
        logger.error('getActivity 錯誤', error);
        next(error);
    }
}

export async function getRecommend(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity);

        // 隨機取得 10 筆資料
        const recommends = await activityRepository
            .createQueryBuilder('activity')
            .leftJoin('activity.category', 'category')
            .where('activity.status = :status', {
                status: ActivityStatus.Published
            })
            .select([
                'activity.id AS id',
                'activity.name AS name',
                'category.name AS category', // 取得 category.name 並命名為 category
                'activity.cover_image AS cover_image',
                'activity.start_time AS start_time',
                'activity.end_time AS end_time'
            ])
            .orderBy('RANDOM()')
            .limit(10)
            .getRawMany();

        if (!recommends || recommends.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        return responseSend(initResponseData(res, 2000, { total_count: recommends.length, results: recommends }));
    } catch (error) {
        logger.error('getRecommend 錯誤', error);
        next(error);
    }
}

export async function getShowtimeAll(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得資料
        const showtimesRepository = dataSource.getRepository(DbEntity.Showtimes);

        // 取得所有場次資料
        const showtimes = await showtimesRepository.find({
            where: {
                activity_id: req.params.activity_id
            },
            relations: {
                site: true,
                showtimeSections: true
            },
            order: {
                start_time: 'ASC'
            }
        });

        if (!showtimes || showtimes.length === 0) {
            return responseSend(initResponseData(res, 1018));
        }

        // 轉換成回傳資料格式
        const results = showtimes.map(showtime => ({
            id: showtime.id,
            start_time: Math.floor(new Date(showtime.start_time).getTime() / 1000), // 轉換為 Unix timestamp（秒）
            location: showtime.site.name,
            address: showtime.site.address,
            seats: showtime.showtimeSections.map((section: ShowtimeSectionsEntity) => ({
                id: section.id,
                section: section.section,
                price: section.price,
                capacity: section.capacity,
                vacancy: section.vacancy
            }))
        }));

        return responseSend(
            initResponseData(res, 2000, {
                total_count: results.length,
                results
            })
        );
    } catch (error) {
        logger.error('getShowtimeAll 錯誤', error);
        next(error);
    }
}

export async function getShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得資料
        const showtimesRepository = dataSource.getRepository(DbEntity.Showtimes);

        // 查詢指定場次，並載入關聯的場地、活動、座位區
        const showtime = await showtimesRepository.findOne({
            where: {
                id: req.params.showtime_id,
                activity_id: req.params.activity_id
            },
            relations: {
                site: true,
                activity: true,
                showtimeSections: true
            }
        });

        if (!showtime) {
            return responseSend(initResponseData(res, 1018)); // 查無資料
        }

        // 轉換成回傳資料格式
        const result = {
            activity: {
                id: showtime.activity.id,
                name: showtime.activity.name,
            },
            showtime: {
                id: showtime.id,
                start_time: dayjs(showtime.start_time).unix(),
                location: showtime.site.name,
                address: showtime.site.address,
                seat_image: showtime.seat_image,
                seats: showtime.showtimeSections.map((section: ShowtimeSectionsEntity) => ({
                    id: section.id,
                    section: section.section,
                    price: section.price,
                    capacity: section.capacity,
                    vacancy: section.vacancy
                }))
            }
        };

        return responseSend(initResponseData(res, 2000, result));
    } catch (error) {
        logger.error('getShowtime 錯誤', error);
        next(error);
    }
}

export async function search(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const keyword = req.query.keyword;
        const category = req.query.category as string;
        const location = req.query.location as string;
        const date_start = req.query.date_start;
        const date_end = req.query.date_end;
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = ActivityStatus.Published;
        const qb = dataSource
            .getRepository(ActivityEntity)
            .createQueryBuilder('activity')
            .innerJoin('activity.organizer', 'organizer')
            .leftJoinAndSelect('activity.category', 'category')
            .leftJoinAndSelect('activity.sites', 'sites')
            .leftJoin('activity.showtimes', 'showtime')
            .where('activity.status = :status', { status })
            .andWhere('activity.is_deleted = false');

        // optional filters
        if (keyword) {
            qb.andWhere('activity.name ILIKE :keyword', { keyword: `%${keyword}%` });
        }

        // filter by categoryIds: '1,9,12'
        if (category) {
            const categoryIds = category.split(',').map(id => parseInt(id.trim(), 10));
            qb.andWhere('activity.category_id IN (:...categoryIds)', { categoryIds });
        }

        // filter by areaIds: '2,8,15'
        if (location) {
            const areaIds = location.split(',').map(id => parseInt(id.trim(), 10));
            qb.andWhere('showtime.site_id = sites.id');
            qb.andWhere('sites.area_id IN (:...areaIds)', { areaIds });
        }

        // TODO: filter by tags

        // filter by date range
        if (date_start && date_end) {
            qb.andWhere('activity.start_time BETWEEN :start AND :end', {
                start: new Date(date_start as string),
                end: new Date(date_end as string)
            });
        } else if (date_start) {
            qb.andWhere('activity.start_time >= :start', { start: new Date(date_start as string) });
        } else if (date_end) {
            qb.andWhere('activity.start_time <= :end', { end: new Date(date_end as string) });
        }

        // TODO: more options to sort
        qb.orderBy('activity.created_at', 'DESC');

        qb.skip(offset).take(limit);
        const [activities, total_count] = await qb.getManyAndCount();
        const responseData = initResponseData(res, 2000);
        responseData.data = {
            total_count: total_count,
            results: activities
        };
        responseSend(responseData);
    } catch (error) {
        logger.error(`搜尋活動錯誤：${error}`);
        next(error);
    }
}
