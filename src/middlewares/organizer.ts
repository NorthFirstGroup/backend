import { Response, NextFunction } from 'express';
import { UserEntity, UserRole } from '../entities/User';
import { Request as JWTRequest } from 'express-jwt';
import { CustomError, RespStatusCode } from '@utils/serverResponse';
import { dataSource } from '@db/data-source';
import { ActivityEntity } from '@entities/Activity';

export type AuthRequest = JWTRequest & { user?: UserEntity; activity?: ActivityEntity };

/** 自定義錯誤 */
function generateError(errorCode: number): Error & { code: number } {
    const error = new Error() as Error & { code: number };
    error.code = errorCode;
    return error;
}

/** Middleware：驗證目前登入的使用者是否為廠商 */
export function isOrganizer(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.auth || req.auth.role !== UserRole.ORGANIZER) {
        next(generateError(1016));
        return;
    }
    next();
}
///** Middleware: 檢查使用者是否為廠商且為活動擁有者 */
export const isActivityOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.auth) {
            throw new CustomError(RespStatusCode.NOT_LOGGED_IN);
        }

        const { activityId } = req.params;
        if (!activityId) {
            throw new CustomError(RespStatusCode.INVALID_ACTIVITY_ID);
        }
        // 檢查使用者是否為廠商
        const organizer = await req.auth.organizer;
        if (!organizer) {
            throw new CustomError(RespStatusCode.NOT_ORGANIZER);
        }
        // 檢查活動ID是否有效
        const activityQ = await dataSource.getRepository(ActivityEntity).findOneBy({ id: Number(activityId) });
        if (!activityQ) {
            throw new CustomError(RespStatusCode.ACTIVITY_NOT_CREATED);
        }
        // 檢查使用者是否為活動擁有者
        if (!organizer || organizer.id !== activityQ.organizer_id) {
            throw new CustomError(RespStatusCode.NO_PERMISSION);
        }
        req.activity = activityQ; // 將活動資訊存入請求對象
        next();
    } catch (error) {
        next(error);
    }
};
