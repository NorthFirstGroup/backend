import { Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import config from '../config'
import jwt from 'jsonwebtoken'
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import getLogger from '../utils/logger'
import responseSend from '../utils/serverResponse'
import { isNotValidString, isNotValidPassword, isNotValidUserName, isNotValidEmail } from '../utils/validation'
import generateJWT from '../utils/generateJWT'
import { getAuthUser } from '../middlewares/auth'
import { dbEntityNameUser } from '../entities/User'

const saltRounds = 10
const logger = getLogger('Users')

export async function postSignup(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { name, email, password } = req.body as {
            name: string
            email: string
            password: string
        }

        if (isNotValidString(name) || isNotValidString(password) || isNotValidString(email)) {
            responseSend(res, 400, '欄位未填寫正確', logger)
            return
        }

        if (isNotValidPassword(password)) {
            responseSend(res, 400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字', logger)
            return
        }

        if (isNotValidUserName(name)) {
            responseSend(res, 400, '使用者名稱不符合規則，最少2個字，最多10個字，不可包含任何特殊符號與空白', logger)
            return
        }

        if (isNotValidEmail(email)) {
            responseSend(res, 400, '不符合Email的格式字串', logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const existingUser = await userRepository.findOne({ where: { email } })

        if (existingUser) {
            responseSend(res, 409, 'Email 已被使用', logger)
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

        responseSend(res, 201, {
            user: {
                id: savedUser.id,
                name: savedUser.name,
            },
        })
    } catch (error) {
        logger.error('建立使用者錯誤:', error)
        next(error)
    }
}

export async function postLogin(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as {
            email: string
            password: string
        }

        if (isNotValidEmail(email)) {
            responseSend(res, 400, '不符合Email的格式字串', logger)
            return
        }

        if (isNotValidPassword(password)) {
            responseSend(res, 400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字', logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const existingUser = await userRepository.findOne({
            select: ['id', 'name', 'password'],
            where: { email },
        })

        if (!existingUser) {
            responseSend(res, 400, '使用者不存在或密碼輸入錯誤')
            return
        }

        const isMatch = await bcrypt.compare(password, existingUser.password)
        if (!isMatch) {
            responseSend(res, 400, '使用者不存在或密碼輸入錯誤')
            return
        }

        const token = await generateJWT(
            { id: existingUser.id },
            config.get('secret.jwtSecret'),
            { expiresIn: config.get('secret.jwtExpiresDay') as jwt.SignOptions['expiresIn'] }
        )

        responseSend(res, 201, {
            token,
            user: {
                name: existingUser.name,
            },
        })
    } catch (error) {
        logger.error('登入錯誤:', error)
        next(error)
    }
}

export async function getProfile(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req)

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const user = await userRepository.findOne({
            select: ['name', 'email'],
            where: { id },
        })

        responseSend(res, 200, { user })
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error)
        next(error)
    }
}

export async function putProfile(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req)
        const { name } = req.body as { name: string }

        if (isNotValidUserName(name)) {
            responseSend(res, 400, '使用者名稱不符合規則，最少2個字，最多10個字，不可包含任何特殊符號與空白', logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const user = await userRepository.findOne({
            select: ['name'],
            where: { id },
        })

        if (!user || user.name === name) {
            responseSend(res, 400, '使用者名稱未變更')
            return
        }

        const updatedResult = await userRepository.update(
            { id, name: user.name },
            { name }
        )

        if (updatedResult.affected === 0) {
            responseSend(res, 400, '更新使用者失敗')
            return
        }

        responseSend(res, 200, {})
    } catch (error) {
        logger.error('更新使用者資料錯誤:', error)
        next(error)
    }
}
