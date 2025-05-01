import { Response, NextFunction } from 'express'
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'
import { Request as JWTRequest } from 'express-jwt'
import { Repository } from 'typeorm'
import { UserEntity } from '../entities/User'

const PERMISSION_DENIED_STATUS_CODE = 401

const FailedMessageMap = {
    expired: 'Token 已過期',
    invalid: '無效的 token',
    missing: '請先登入',
}

/** 自定義錯誤 */
function generateError(status: number, message: string): Error & { status: number } {
    const error = new Error(message) as Error & { status: number }
    error.status = status
    return error
}

/** 將 JWT 驗證錯誤格式化為自訂錯誤 */
function formatVerifyError(jwtError: VerifyErrors): Error & { status: number } {
    switch (jwtError.name) {
        case 'TokenExpiredError':
            return generateError(PERMISSION_DENIED_STATUS_CODE, FailedMessageMap.expired)
        default:
            return generateError(PERMISSION_DENIED_STATUS_CODE, FailedMessageMap.invalid)
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
    secret: string
    userRepository: Repository<UserEntity>
    logger?: Pick<Console, 'error' | 'warn'>
}

/** 回傳一個 Express middleware，驗證 JWT 並查找使用者資料 */
export function createAuthMiddleware({secret, userRepository, logger = console }: AuthMiddlewareOptions) {
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
            next(generateError(PERMISSION_DENIED_STATUS_CODE, FailedMessageMap.missing))
            return
        }

        const [, token] = authHeader.split(' ')
        if (!token) {
            logger.warn('[AuthV2] Token not found in authorization header.')
            next(generateError(PERMISSION_DENIED_STATUS_CODE, FailedMessageMap.missing))
            return
        }

        try {
            const verifyResult = await verifyJWT(token, secret)
            const user = await userRepository.findOneBy({ id: verifyResult.id })
            if (!user) {
                next(generateError(PERMISSION_DENIED_STATUS_CODE, FailedMessageMap.invalid))
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