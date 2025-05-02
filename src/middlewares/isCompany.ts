import { Request, Response, NextFunction } from 'express'
import { UserEntity, UserRole } from '../entities/User'

const FORBIDDEN_MESSAGE = '使用者尚未成為廠商'
const PERMISSION_DENIED_STATUS_CODE = 401

/** 自定義錯誤 */
function generateError(
    status: number = PERMISSION_DENIED_STATUS_CODE,
    message: string = FORBIDDEN_MESSAGE
): Error & { status: number } {
    const error = new Error(message) as Error & { status: number }
    error.status = status
    return error
}

/** Middleware：驗證目前登入的使用者是否為廠商 */
export function requireCompanyRole(req: Request & { user?: UserEntity }, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== UserRole.ORGANIZER) {
        next(generateError())
        return
    }
    next()
}
