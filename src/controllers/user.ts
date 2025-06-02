import { Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import config from '../config'
import jwt from 'jsonwebtoken'
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import { DbEntity } from '../constants/dbEntity';
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import { isNotValidString, isNotValidPassword, isNotValidUserName, isNotValidEmail, isNotValidPhoneNumber, isNotValidBirthday, isNotValidUrl } from '../utils/validation'
import generateJWT from '../utils/generateJWT'
import { getAuthUser } from '../middlewares/auth'
import { dbEntityNameUser, UserRole } from '../entities/User'
import { dbEntityNameArea } from '../entities/Area'
import { In } from 'typeorm'
import formidable from 'formidable'
import { uploadUserAvatar, getUserAvatarUrl } from '../utils/uploadFile'
import path from 'path'

const saltRounds = 10
const logger = getLogger('User')

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true
} as const;
type AllowedMimeTypes = keyof typeof ALLOWED_MIME_TYPES;

/** 註冊 */
export async function postSignup(req: JWTRequest, res: Response, next: NextFunction, version = 'v1') {
    try {
        const { name, email, password } = req.body as {
            name: string
            email: string
            password: string
        }

        if (isNotValidString(name) || isNotValidString(password) || isNotValidString(email)) {
            responseSend(initResponseData(res, 1000), logger)
            return
        }

        if (isNotValidPassword(password)) {
            responseSend(initResponseData(res, 1003), logger)
            return
        }

        if (isNotValidUserName(name)) {
            responseSend(initResponseData(res, 1006), logger)
            return
        }

        if (isNotValidEmail(email)) {
            responseSend(initResponseData(res, 1007), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const existingUser = await userRepository.findOne({ where: { email } })

        if (existingUser) {
            responseSend(initResponseData(res, 1004), logger)
            return
        }

        const password_hash = await bcrypt.hash(password, saltRounds)
        const newUser = userRepository.create({
            nick_name: name,
            email,
            role: UserRole.USER,
            password_hash,
            status: 1,
        })

        const savedUser = await userRepository.save(newUser)
        logger.info('新建立的使用者ID:', savedUser.id)

        if (version === 'v2') {
            const token = await generateJWT(
                { id: savedUser.id, role: savedUser.role },
                config.get('secret.jwtSecret'),
                { expiresIn: config.get('secret.jwtExpiresDay') as jwt.SignOptions['expiresIn'] }
            )

            responseSend(initResponseData(res, 2000, {
                token,
                user: {
                    name: savedUser.nick_name,
                    role: savedUser.role,
                    profile_url: '',
                },
            }))
            return
        }

        responseSend(initResponseData(res, 2000, {
            user: {
                id: savedUser.id,
                name: savedUser.nick_name,
            },
        }))
    } catch (error) {
        logger.error('建立使用者錯誤:', error)
        next(error)
    }
}

/** 登入 */
export async function postSignin(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as {
            email: string
            password: string
        }

        if (isNotValidEmail(email)) {
            responseSend(initResponseData(res, 1007), logger)
            return
        }

        if (isNotValidPassword(password)) {
            responseSend(initResponseData(res, 1003), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const existingUser = await userRepository.findOne({
            select: ['id', 'nick_name', 'password_hash', 'role', 'profile_url'],
            where: { email },
        })

        if (!existingUser) {
            responseSend(initResponseData(res, 1005))
            return
        }

        const isMatch = await bcrypt.compare(password, existingUser.password_hash)
        if (!isMatch) {
            responseSend(initResponseData(res, 1005))
            return
        }

        const token = await generateJWT(
            { id: existingUser.id, role: existingUser.role },
            config.get('secret.jwtSecret'),
            { expiresIn: config.get('secret.jwtExpiresDay') as jwt.SignOptions['expiresIn'] }
        )

        responseSend(initResponseData(res, 2000, {
            token,
            user: {
                name: existingUser.nick_name,
                role: existingUser.role,
                profile_url: existingUser?.profile_url || '',
            },
        }))
    } catch (error) {
        logger.error('登入錯誤:', error)
        next(error)
    }
}

/** 取得使用者資料 */
export async function getProfile(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req)

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const user = await userRepository.findOne({
            select: ['nick_name', 'phone', 'birth_date', 'profile_url'],
            where: { id },
            loadRelationIds: { relations: ['location_ids'] }, // 僅載入 location_ids 的 ID
        })

        if (!user) {
            responseSend(initResponseData(res, 1008))
            return
        }

        const url = await getUserAvatarUrl(id, user.profile_url)
        responseSend(initResponseData(res, 2000, {
            name: user.nick_name,
            phone_num: user.phone || '',
            birth_date: user.birth_date || '',
            location_ids: user.location_ids || [],
            profile_url: url || '',
        }))
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error)
        next(error)
    }
}

/** 修改使用者資料 */
export async function putProfile(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req)
        const { name, phone_num, birth_date, location_ids, profile_url } = req.body as { name: string, phone_num: string, birth_date: string, location_ids: number[], profile_url: string }

        if (isNotValidUserName(name)) {
            responseSend(initResponseData(res, 1006), logger)
            return
        }

        if (phone_num !== '' && isNotValidPhoneNumber(phone_num)) {
            responseSend(initResponseData(res, 1009), logger)
            return
        }

        if (birth_date !== '' && isNotValidBirthday(birth_date)) {
            responseSend(initResponseData(res, 1010), logger)
            return
        }

        if (profile_url !== '' && isNotValidUrl(profile_url)) {
            responseSend(initResponseData(res, 1011), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const areaRepository = dataSource.getRepository(dbEntityNameArea)

        // 查詢要更新的用戶
        const user = await userRepository.findOne({
            where: { id },
            relations: ['location_ids'], // 載入當前的 location_ids 關聯
        })

        if (!user) {
            responseSend(initResponseData(res, 1008), logger)
            return
        }

        // 查找 Area 實體
        const areas = (location_ids.length > 0) ? await areaRepository.findBy({ id: In(location_ids) }) : [];

        user.nick_name = name

        if (phone_num !== '')
            user.phone = phone_num
        if (birth_date !== '')
            user.birth_date = new Date(birth_date)
        if (profile_url !== '')
            user.profile_url = profile_url

        user.location_ids = areas
    
        await userRepository.save(user)

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('更新使用者資料錯誤:', error)
        next(error)
    }
}

/** 修改使用者密碼 */
export async function putPassword(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req)
        const { password, new_password } = req.body as { password: string, new_password: string }

        if (isNotValidPassword(password) || isNotValidPassword(new_password)) {
            responseSend(initResponseData(res, 1003), logger)
            return
        }

        if (password === new_password) {
            responseSend(initResponseData(res, 1012), logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const user = await userRepository.findOne({
            select: ['password_hash'],
            where: { id },
        })

        if (!user) {
            responseSend(initResponseData(res, 1008), logger)
            return
        }

        const isMatch = await bcrypt.compare(password, user.password_hash)
        if (!isMatch) {
            responseSend(initResponseData(res, 1001), logger)
            return
        }

        const password_hash = await bcrypt.hash(new_password, saltRounds)
        const updatedResult = await userRepository.update(
            { id },
            { password_hash: password_hash },
        )

        if (updatedResult.affected === 0) {
            responseSend(initResponseData(res, 1002), logger)
            return
        }

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('更新使用者密碼錯誤:', error)
        next(error)
    }
}

/** 上傳使用者圖片 */
export async function postUpload(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req)
        const userRepository = dataSource.getRepository(dbEntityNameUser)
        const user = await userRepository.findOne({
            where: { id },
        })

        if (!user) {
            responseSend(initResponseData(res, 1008), logger)
            return
        }

        const form = formidable({
            multiples: false,
            maxFileSize: MAX_FILE_SIZE,
            allowEmptyFiles: false,
            filter: ({ mimetype }) => {
                if (!mimetype) return false
                return !!ALLOWED_MIME_TYPES[mimetype as AllowedMimeTypes]
            }
        })

        const [fields, files] = await form.parse(req)
        // console.log('files:', files)
        // console.log('fields:', fields)
        const userId : string | undefined = fields.user_id? fields.user_id[0] : fields.user_id
        if (userId !== id) {
            responseSend(initResponseData(res, 1008), logger)
            return
        }

        const rawFile = files.file
        const file: formidable.File | undefined = Array.isArray(rawFile) ? rawFile[0] : rawFile;
        if (!file || !file.filepath) {
            logger.error('No file uploaded')
            responseSend(initResponseData(res, 1013), logger)
            return
        }

        await uploadUserAvatar(file, id);
        const fileExt = path.extname(file.originalFilename || '')
        user.profile_url = `avatar${fileExt}`
        await userRepository.save(user)
        const url = await getUserAvatarUrl(id, user.profile_url)
        responseSend(initResponseData(res, 2000, { url }))
    } catch (error) {
        logger.error('上傳圖片錯誤:', error)
        next(error)
    }
}

export async function applyAsOrganizer(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id } = getAuthUser(req);
        const organizerRepository = dataSource.getRepository(DbEntity.Organizer);
        const existingOrganizer = await organizerRepository.findOne({ where: { user_id: id } });
        if (existingOrganizer) {
            responseSend(initResponseData(res, 1020), logger)
            return
        }

        const newOrganizer = organizerRepository.create({
            user_id: id,
            status: 1,  // 目前預設直接審核通過
            ...req.body
        });
        organizerRepository.save(newOrganizer);

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('申請成為廠商錯誤:', error)
        next(error)
    }
}