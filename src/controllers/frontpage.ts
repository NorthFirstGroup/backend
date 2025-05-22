import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { dataSource } from '../db/data-source'
import { DbEntity } from '../constants/dbEntity'

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

    const newArrivals = await activityRepository.find({
      select: ['id', 'name', 'cover_image', 'category_id']
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