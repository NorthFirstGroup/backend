import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import formidable from 'formidable'
import { uploadPublicImage } from '../utils/uploadFile'

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