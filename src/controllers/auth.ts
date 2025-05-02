import { Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import config from '../config'
import jwt from 'jsonwebtoken'
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { isNotValidString, isNotValidPassword, isNotValidUserName, isNotValidEmail } from '../utils/validation'
import generateJWT from '../utils/generateJWT'
import { dbEntityNameUser } from '../entities/User'

const saltRounds = 10
const logger = getLogger('Auth')

export async function postForgetPassword(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { name, email, password } = req.body as {
            name: string
            email: string
            password: string
        }

        if (isNotValidString(name) || isNotValidString(password) || isNotValidString(email)) {
            responseSend(initResponseData(res, 4000), logger)
            return
        }

        if (isNotValidPassword(password)) {
            responseSend(initResponseData(res, 4001), logger)
            return
        }

        if (isNotValidUserName(name)) {
            responseSend(initResponseData(res, 4002), logger)
            return
        }

        if (isNotValidEmail(email)) {
            responseSend(initResponseData(res, 4003), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const existingUser = await userRepository.findOne({ where: { email } })

        if (existingUser) {
            responseSend(initResponseData(res, 4004), logger)
            return
        }

        const hashPassword = await bcrypt.hash(password, saltRounds)
        const newUser = userRepository.create({
            name,
            email,
            role: 'USER',
            password: hashPassword,
        })

        const savedUser = await userRepository.save(newUser)
        logger.info('新建立的使用者ID:', savedUser.id)

        responseSend(initResponseData(res, 2000, {
            user: {
                id: savedUser.id,
                name: savedUser.name,
            },
        }))
    } catch (error) {
        logger.error('建立使用者錯誤:', error)
        next(error)
    }
}

export async function postResetPassword(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as {
            email: string
            password: string
        }

        if (isNotValidEmail(email)) {
            responseSend(initResponseData(res, 4003), logger)
            return
        }

        if (isNotValidPassword(password)) {
            responseSend(initResponseData(res, 4001), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const existingUser = await userRepository.findOne({
            select: ['id', 'name', 'password'],
            where: { email },
        })

        if (!existingUser) {
            responseSend(initResponseData(res, 4005))
            return
        }

        const isMatch = await bcrypt.compare(password, existingUser.password)
        if (!isMatch) {
            responseSend(initResponseData(res, 4005))
            return
        }

        const token = await generateJWT(
            { id: existingUser.id },
            config.get('secret.jwtSecret'),
            { expiresIn: config.get('secret.jwtExpiresDay') as jwt.SignOptions['expiresIn'] }
        )

        responseSend(initResponseData(res, 2000, {
            token,
            user: {
                name: existingUser.name,
            },
        }))
    } catch (error) {
        logger.error('登入錯誤:', error)
        next(error)
    }
}