import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { dataSource } from '../db/data-source'
import { DbEntity } from '../constants/dbEntity'
import { Between } from 'typeorm'

const logger = getLogger('Frontpage')

export async function getTop(req: JWTRequest, res: Response, next: NextFunction) {
  try {
    // 取得清單資料
    const activityRepository = dataSource.getRepository(DbEntity.Activity)

    const tops = await activityRepository.find({
      select: ['id', 'name', 'cover_image'],
    })

    if (!tops || tops.length === 0) {
      return responseSend(initResponseData(res, 1018))
    }

    return responseSend(initResponseData(res, 2000, {results: tops}))
  } catch (error) {
    logger.error('getTop 錯誤:', error)
    next(error)
  }
}

export async function getHotTopics(req: JWTRequest, res: Response, next: NextFunction) {
  try {
    // 取得清單資料
    const activityRepository = dataSource.getRepository(DbEntity.Activity)

    const topics = await activityRepository.find({
      select: ['id', 'name', 'cover_image', 'category_id', 'start_time', 'end_time']
    })

    if (!topics || topics.length === 0) {
      return responseSend(initResponseData(res, 1018))
    }

    return responseSend(initResponseData(res, 2000, {results: topics}))
  } catch (error) {
    logger.error('getHotTopics 錯誤:', error)
    next(error)
  }
}

export async function getNewArrivals(req: JWTRequest, res: Response, next: NextFunction) {
  try {
    // 取得清單資料
    const activityRepository = dataSource.getRepository(DbEntity.Activity)

    // 取得全新登場近到遠
    const newArrivals = await activityRepository.find({
      select: ['id', 'name', 'cover_image', 'category_id'],
      order: { created_at: 'DESC' },
      take: 10,
    })

    if (!newArrivals || newArrivals.length === 0) {
      return responseSend(initResponseData(res, 1018))
    }

    return responseSend(initResponseData(res, 2000, {results: newArrivals}))
  } catch (error) {
    logger.error('getNewArrivals 錯誤:', error)
    next(error)
  }
}

export async function getLowStock(req: JWTRequest, res: Response, next: NextFunction) {
  try {
    // 取得清單資料
    const activityRepository = dataSource.getRepository(DbEntity.Activity)

    const lowStocks = await activityRepository.find({
      select: ['id', 'name', 'cover_image', 'category_id', 'start_time', 'end_time']
    })

    if (!lowStocks || lowStocks.length === 0) {
      return responseSend(initResponseData(res, 1018))
    }

    return responseSend(initResponseData(res, 2000, {results: lowStocks}))
  } catch (error) {
    logger.error('getLowStock 錯誤:', error)
    next(error)
  }
}

export async function getComingSoon(req: JWTRequest, res: Response, next: NextFunction) {
  try {
    // 取得清單資料
    const activityRepository = dataSource.getRepository(DbEntity.Activity)

    const now = new Date()
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 三天後的日期

    const comingSoons = await activityRepository.find({
      select: ['id', 'name', 'cover_image', 'category_id', 'sales_start_time'],
      order: { sales_start_time: 'ASC' },
      where: {
        sales_start_time: Between(now, threeDaysLater),
      }
    })

    if (!comingSoons || comingSoons.length === 0) {
      return responseSend(initResponseData(res, 1018))
    }

    return responseSend(initResponseData(res, 2000, {results: comingSoons}))
  } catch (error) {
    logger.error('getComingSoon 錯誤:', error)
    next(error)
  }
}