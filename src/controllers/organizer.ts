import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import { getAuthUser } from '../middlewares/auth'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import formidable from 'formidable'
import { uploadPublicImage } from '../utils/uploadFile'
import { ActivityEntity } from '../entities/Activity'

const logger = getLogger('Organizer')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true
} as const;
type AllowedMimeTypes = keyof typeof ALLOWED_MIME_TYPES;

export async function postApply(req: JWTRequest, res: Response, next: NextFunction) {
    try {

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('postApply 錯誤:', error)
        next(error)
    }
}

export async function getActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const name = req.query.name;
        const categoryId = parseInt(req.query.category as string) || null;
        const status = parseInt(req.query.status as string) || null;
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 10;
        const qb = dataSource
            .getRepository(ActivityEntity)
            .createQueryBuilder('activity')
            .innerJoin('activity.organizer', 'organizer')
            .leftJoinAndSelect('activity.category', 'category')
            .leftJoinAndSelect('activity.sites', 'sites')
            .where('organizer.user_id = :userId', { userId })
            .andWhere('activity.is_deleted = false');

        qb.orderBy('activity.created_at', 'DESC');

        // Optional filters
        if (name) {
            qb.andWhere('activity.name ILIKE :name', { name: `%${name}%` });
        }

        if (typeof status === 'number') {
            qb.andWhere('activity.status = :status', { status });
        }

        if (categoryId) {
            qb.andWhere('activity.category_id = :categoryId', { categoryId });
        }

        // Pagination
        qb.skip(offset).take(limit);

        const [activities, total_count] = await qb.getManyAndCount();
        console.log(activities);
        const responseData = initResponseData(res, 2000);
        responseData.data = {
            total_count: total_count,
            results: activities
        };
        responseSend(responseData);
    } catch (error) {
        logger.error(`取得廠商活動錯誤：${error}`)
        next(error)
    }
}

/** 上傳圖片 */
export async function postUploadImage(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const form = formidable({
            multiples: false,
            maxFileSize: MAX_FILE_SIZE,
            allowEmptyFiles: false,
            filter: ({ mimetype }) => {
                if (!mimetype) return false
                return !!ALLOWED_MIME_TYPES[mimetype as AllowedMimeTypes]
            }
        })

        const [_fields, files] = await form.parse(req)
        const rawFile = files.file
        const file: formidable.File | undefined = Array.isArray(rawFile) ? rawFile[0] : rawFile;
        if (!file || !file.filepath) {
            logger.error('No file uploaded')
            responseSend(initResponseData(res, 1013), logger)
            return
        }

        const url = await uploadPublicImage(file);
        responseSend(initResponseData(res, 2000, { url }))
    } catch (error) {
        logger.error('上傳圖片錯誤:', error)
        next(error)
    }
}