import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { DbEntity } from '../constants/dbEntity'
import { dataSource } from '../db/data-source'

const logger = getLogger('Activity')

export async function getActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
    const { activity_id } = req.params
    // 取得資料
    const activityRepository = dataSource.getRepository(DbEntity.Activity)

    const activity = await activityRepository.findOne({
        where: { id: activity_id },
        select: ['id', 'name', 'category', 'cover_image', 'description', 'information']
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

        const recommends = await activityRepository.find({
            select: ['id', 'name', 'category', 'cover_image', 'start_time', 'end_time']
        })

        if (!recommends || recommends.length === 0) {
            return responseSend(initResponseData(res, 1018))
        }

        return responseSend(initResponseData(res, 2000, {results: recommends}))
    } catch (error) {
        logger.error('getRecommend 錯誤', error)
        next(error)
    }
}