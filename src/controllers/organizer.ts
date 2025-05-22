import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { DbEntity } from '../constants/dbEntity'
import { dataSource } from '../db/data-source'

const logger = getLogger('Organizer')

export async function postApply(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const organizerRepo = dataSource.getRepository(DbEntity.Organizer)
        const { name, email, phone, address } = req.body;
        const newOrganizer = organizerRepo.create({ name, email, phone, address, user_id:'30a4bae0-c5b6-43e7-938d-a4c0f3a2f304' });        const savedOrganizer = await organizerRepo.save(newOrganizer)
        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('postApply 錯誤:', error)
        next(error)
    }
}

export async function postActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activityRepo = dataSource.getRepository(DbEntity.Activity)
        const newActivity = activityRepo.create({...req.body, organizer_id:'674eb3dc-b5f1-438c-87b8-a62b2f5d09b5'})
        const savedActivity = await activityRepo.save(newActivity)
        return responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('postActivity 錯誤:', error)
        next(error)
    }
  }