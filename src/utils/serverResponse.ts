import { Response } from 'express'
import { Logger } from 'pino'

/** 根據 HTTP 狀態碼格式化回應資料並送出，並在錯誤情況下使用 logger 記錄。
 * @param res - Express 的回應物件
 * @param code - HTTP 狀態碼，如 200、400 等
 * @param data - 要回傳的資料或錯誤訊息
 * @param logger - 可選的 logger 物件
 */
export default function responseSend (res: Response, code: number, data: object | string, logger?: Logger) {
    const responseData: { status: string, data?: object, message?: string } = {
        status: 'failed'
    }

    switch (code) {
        case 200:
        case 201:
            responseData.status = 'success'
            break
        case 400:
        case 409:
            responseData.status = 'failed'
            break
        case 500:
            responseData.status = 'error'
            break
    }

    if (responseData.status === 'success') {
        if (data && typeof data === 'object') responseData.data = data
    } else {
        if (logger) logger.warn(data)
        responseData.message = data as string
    }

    res.status(code).json(responseData)
}