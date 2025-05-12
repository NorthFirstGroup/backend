import { Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import config from '../config'
import jwt from 'jsonwebtoken'
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { isNotValidPassword, isNotValidEmail } from '../utils/validation'
import generateJWT from '../utils/generateJWT'
import { dbEntityNameUser } from '../entities/User'
import sendEmail from '../utils/sendEmail'

const saltRounds = 10
const logger = getLogger('Auth')

/** 忘記密碼（未完成） */
export async function postForgetPassword(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { email } = req.body as { email: string }

        if (isNotValidEmail(email)) {
            responseSend(initResponseData(res, 1007), logger)
            return
        }

        const token = await generateJWT(
            { id: email },
            config.get('secret.jwtSecret'),
            { expiresIn: config.get('mail.jwtExpiresMinute') as jwt.SignOptions['expiresIn'] }
        )

        sendEmail({
            to: email,
            subject: 'GoTicket 密碼重新設定通知',
            text: '',
        })

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('postForgetPassword 錯誤:', error)
        next(error)
    }
}

/** 未登入狀態重設密碼（未完成） */
export async function postResetPassword(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as { email: string, password: string }

        if (isNotValidPassword(password)) {
            responseSend(initResponseData(res, 4001), logger)
            return
        }

        if (isNotValidEmail(email)) {
            responseSend(initResponseData(res, 1007), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const password_hash = await bcrypt.hash(password, saltRounds)
        const updatedResult = await userRepository.update(
            { email },
            { password_hash: password_hash },
        )

        if (updatedResult.affected === 0) {
            responseSend(initResponseData(res, 1002), logger)
            return
        }

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('postResetPassword 錯誤:', error)
        next(error)
    }
}