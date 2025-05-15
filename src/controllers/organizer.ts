import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'

const logger = getLogger('Organizer')

export async function postApply(req: JWTRequest, res: Response, next: NextFunction) {
    try {

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('postApply 錯誤:', error)
        next(error)
    }
}