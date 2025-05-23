import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { DbEntity } from '../constants/dbEntity'
import { dataSource } from '../db/data-source'
import { ShowtimeSectionsEntity } from '../entities/ShowtimeSections'

const logger = getLogger('Activity')

export async function getActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { activity_id } = req.params
        // 取得資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity)

        const activity = await activityRepository.findOne({
            where: { id: activity_id },
            select: ['id', 'name', 'category_id', 'cover_image', 'description', 'information']
        })

        if (!activity) {
            return responseSend(initResponseData(res, 1018))
        }

        return responseSend(initResponseData(res, 2000, activity))
    } catch (error) {
        logger.error('getActivity 錯誤', error)
        next(error)
    }
}

export async function getRecommend(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得資料
        const activityRepository = dataSource.getRepository(DbEntity.Activity)

        // 隨機取得 10 筆資料
        const recommends = await activityRepository.createQueryBuilder('activity')
            .select([
                'activity.id',
                'activity.name',
                'activity.category_id',
                'activity.cover_image',
                'activity.start_time',
                'activity.end_time',
            ])
            .orderBy('RANDOM()')
            .limit(10)
            .getMany()

        if (!recommends || recommends.length === 0) {
            return responseSend(initResponseData(res, 1018))
        }

        return responseSend(initResponseData(res, 2000, { results: recommends }))
    } catch (error) {
        logger.error('getRecommend 錯誤', error)
        next(error)
    }
}


export async function getShowtimeAll(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        // 取得資料
        const showtimesRepository = dataSource.getRepository(DbEntity.Showtimes)

        // 取得所有場次資料
        const showtimes = await showtimesRepository.find({
            relations: {
                site: true,
                showtimeSections: true,
            },
            order: {
                start_time: 'ASC'
            }
        })

        if (!showtimes || showtimes.length === 0) {
            return responseSend(initResponseData(res, 1018))
        }

        // 轉換成回傳資料格式
        const results = showtimes.map(showtime => ({
            id: showtime.id,
            start_time: Math.floor(new Date(showtime.start_time).getTime() / 1000), // 轉換為 Unix timestamp（秒）
            location: showtime.site.name,
            address: showtime.site.address,
            seats: showtime.showtimeSections.map((section: ShowtimeSectionsEntity
            ) => ({
                id: section.id,
                section: section.section,
                price: section.price,
                capacity: section.capacity,
                vacancy: section.vacancy,
            }))
        }));

        return responseSend(initResponseData(res, 2000, {
            total_count: results.length,
            results,
        }))
    } catch (error) {
        logger.error('getShowtimeAll 錯誤', error)
        next(error)
    }
}