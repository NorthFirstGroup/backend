import { Response } from 'express'
import { Logger } from 'pino'

/** 狀態碼與對應的訊息 */
const codeMessageMap: Record<number, string> = {
    2000: '',

    1000: '欄位未填寫正確',
    1001: '密碼輸入錯誤',
    1002: '更新失敗',
    1003: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字',
    1004: 'Email 已被使用',
    1005: '使用者不存在或密碼輸入錯誤',
    1006: '使用者名稱不符合規則，最少2個字，最多10個字，不可包含任何特殊符號與空白',
    1007: '電子郵件不符合規則',
    1008: '使用者不存在',
    1009: '電話號碼不符合規則',
    1010: '無效日期',
    1011: '網址不符合規則',
    1012: '新密碼與舊密碼相同',
    1013: '檔案上傳失敗',
    1014: '無效的 Token',
    1015: '請先登入',
    1016: '使用者尚未成為廠商',
    1017: 'Token 已過期',

    5555: '伺服器錯誤',
}

/** 回應資料格式 */
export interface ResponseData {
    /** Express 的回應物件 */
    res: Response
    /** 狀態碼，對應 codeMessageMap */
    code: number
    /** 要回傳的內容 */
    data?: object
    /** 可選的自訂訊息 */
    message?: string
}

/** 初始回應資料 */
export const initResponseData = (
    res: Response,
    code: number,
    data?: object,
    message?: string
): ResponseData => ({ res, code, data, message })

/** 根據 HTTP 狀態碼格式化回應資料並送出，並在錯誤情況下使用 logger 記錄。
 * @param resData - 回應資料
 * @param logger - 可選的 logger 物件
 */
export default function responseSend(resData: ResponseData, logger?: Logger) {
    const { res, code, data, message } = resData

    if (!res) return

    const responseData: {
        status_code: number
        data?: object
        message: string
    } = {
        status_code: code,
        message: message ?? codeMessageMap[code] ?? '未知錯誤',
    }

    if (responseData.status_code === 2000) {
        if (data && typeof data === 'object') responseData.data = data
    } else if (logger) {
        logger.warn(data)
    }

        switch (code) {
        case 2000:
            res.status(200).json(responseData)
            break
        case 5555:
            res.status(500).json(responseData)
            break
        default:
            res.status(400).json(responseData)
            break
    }
}
