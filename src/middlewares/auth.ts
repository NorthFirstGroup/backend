import { Response, NextFunction } from 'express'
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'
import { Request as JWTRequest } from 'express-jwt'
import { Repository } from 'typeorm'
import { UserEntity } from '../entities/User'

/** 自定義錯誤 */
function generateError(errorCode: number): Error & { code: number } {
    const error = new Error() as Error & { code: number }
    error.code = errorCode
    return error
}

/** 將 JWT 驗證錯誤格式化為自訂錯誤 */
function formatVerifyError(jwtError: VerifyErrors): Error & { code: number } {
    switch (jwtError.name) {
        case 'TokenExpiredError':
            return generateError(1017)
        default:
            return generateError(1014)
    }
}

/** 驗證 JWT 並解析 payload */
function verifyJWT(token: string, secret: string): Promise<JwtPayload & { id: string }> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (error, decoded) => {
            if (error) {
                reject(formatVerifyError(error))
            } else {
                resolve(decoded as JwtPayload & { id: string })
            }
        })
    })
}

interface AuthMiddlewareOptions {
    /** 密鑰 */
    secret: string
    /** 使用者資料庫 */
    userRepository: Repository<UserEntity>
    /** logger */
    logger?: Pick<Console, 'error' | 'warn'>
    /** 是否改查找 email */
    isFindEmail?: boolean
}

/** 回傳一個 Express middleware，驗證 JWT 並查找使用者資料 */
export function createAuthMiddleware({secret, userRepository, logger = console, isFindEmail }: AuthMiddlewareOptions) {
    if (!secret || typeof secret !== 'string') {
        logger.error('[AuthV2] secret is required and must be a string.')
        throw new Error('[AuthV2] secret is required and must be a string.')
    }

    if (!userRepository || typeof userRepository !== 'object' || typeof userRepository.findOneBy !== 'function') {
        logger.error('[AuthV2] userRepository is required and must be a TypeORM repository.')
        throw new Error('[AuthV2] userRepository is required and must be a TypeORM repository.')
    }

    return async (req: JWTRequest, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers?.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('[AuthV2] Missing or malformed authorization header.')
            next(generateError(1015))
            return
        }

        const [, token] = authHeader.split(' ')
        if (!token) {
            logger.warn('[AuthV2] Token not found in authorization header.')
            next(generateError(1015))
            return
        }

        try {
            const verifyResult = await verifyJWT(token, secret)
            let user = null;

            if (isFindEmail)
                user = await userRepository.findOneBy({ email: verifyResult.email })
            else                
                user = await userRepository.findOneBy({ id: verifyResult.id })

            if (!user) {
                if (isFindEmail)
                    next(generateError(1017))
                else
                    next(generateError(1014))
                return
            }

            req.auth = user
            next()
        } catch (error) {
            logger.error(`[AuthV2] ${(error as Error).message}`)
            next(error)
        }
    }
}

/** 轉換 req.auth 為使用者資料 */
export function getAuthUser(req: JWTRequest): UserEntity {
    return (req.auth as UserEntity)
}