import { Response } from 'express';
import { Logger } from 'pino';

export enum RespStatusCode {
    OK = 2000, // 成功
    FIELD_ERROR = 1000, // 欄位未填寫正確
    UPDATE_FAILED = 1002, // 更新失敗
    INVALID_DATE = 1010, // 無效日期
    NOT_LOGGED_IN = 1015, // 請先登入
    NOT_ORGANIZER = 1016, // 使用者尚未成為廠商
    AREA_ID_NOT_EXIST = 1021, // 區域ID 不存在
    INVALID_ACTIVITY_ID = 1603, // 活動 ID 無效或已刪除
    INVALID_SITE_ID = 1604, // 場次 ID 無效或不屬於該活動

    ACTIVITY_NOT_CREATED = 3001, // 活動尚未建立
    NO_PERMISSION = 3003, // 無權限
    DELETE_FAILED = 3006, // 刪除失敗
    SERVER_ERROR = 5555, // 伺服器錯誤

    INVALID_REQUEST = 9001 // 無效請求
}

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
    1018: '查無清單資料',
    1019: '廠商不存在或尚未通過驗證',
    1020: '已申請過廠商',
    1021: '區域ID 不存在',

    //建立訂單
    1601: '票券數量超過上限 (最多4筆)',
    1602: '票券資訊格式錯誤 (zone, price, quantity 必填且有效)',
    1603: '活動 ID 無效或已刪除',
    1604: '場次 ID 無效或不屬於該活動',
    1605: '場次未設定座位分區資訊',
    1606: '活動目前不在銷售期間',
    1607: '區域 "VIP/A/B/..." 不存在於此場次',
    1608: '區域 "VIP/A/B/..." 的價格不正確或未設定',
    1609: '區域 "VIP/A/B/..." 的座位數量不足',
    1610: '建立訂單失敗',
    1611: '一次最多可訂 4 個座位',

    //取得個人訂單詳細資訊
    1620: '找不到訂單或未經授權',
    1621: '找不到訂單聯絡人',

    //取得個人訂單資訊列表
    1622: '無效的排序欄位',
    1623: '排序順序 (order) 必須是 "asc" 或 "desc"',
    //取得票券詳細資訊
    1624: '找不到指定的票券或您沒有權限查看此票券',

    3001: '活動尚未建立',
    3002: '活動場地尚未建立',
    3003: '無權限查看或修改',
    3004: '無此場次或不屬於該活動',
    3005: '提供的 site_id 無效或不屬於該活動',
    3006: '場次開始時間超出允許範圍',
    3007: '該地點與時段已有其他場次',
    3008: '該場次已開放售票，無法修改',
    3009: '該場次已有成立的訂單，無法修改',
    3010: '該活動已取消或結束，禁止異動',
    3011: '票券已使用，無法操作',
    3012: '目前非驗票或入場時段，請確認開使時間',

    5555: '伺服器錯誤',
    5601: '服務器錯誤：座位服務未準備好',
    5602: '內部服務器錯誤：座位庫存數據異常',

    9001: '無效請求'
};

/** 回應資料格式 */
export interface ResponseData {
    /** Express 的回應物件 */
    res: Response;
    /** 狀態碼，對應 codeMessageMap */
    code: number;
    /** 要回傳的內容 */
    data?: object;
    /** 可選的自訂訊息 */
    message?: string;
}

/** 初始回應資料 */
export const initResponseData = (res: Response, code?: number, data?: unknown, message?: string): ResponseData => ({
    res,
    code: code || 2000,
    data: typeof data === 'object' && data !== null ? data : undefined,
    message: message
});

/** 根據 HTTP 狀態碼格式化回應資料並送出，並在錯誤情況下使用 logger 記錄。
 * @param resData - 回應資料
 * @param logger - 可選的 logger 物件
 */
export default function responseSend(resData: ResponseData, logger?: Logger) {
    const { res, code, data, message } = resData;

    if (!res) return;

    const responseData: {
        status_code: number;
        data?: object;
        message: string;
    } = {
        status_code: code,
        message: (message || codeMessageMap[code]) ?? '未知錯誤'
    };

    if (responseData.status_code === 2000) {
        if (data && typeof data === 'object') responseData.data = data;
    } else if (logger) {
        logger.warn(data);
    }
    switch (code) {
        case 2000:
            res.status(200).json(responseData);
            break;
        case 5555:
            res.status(500).json(responseData);
            break;
        default:
            res.status(400).json(responseData);
            break;
    }
}

export class CustomError extends Error {
    httpStatus: number = 500;
    message: string;
    code: number = RespStatusCode.SERVER_ERROR;
    data: unknown;

    constructor(statusCode?: number, serverMessage?: string, httpStatus?: number, data?: unknown) {
        super();
        this.httpStatus = httpStatus || 500;
        this.code = statusCode || RespStatusCode.SERVER_ERROR;
        this.message = serverMessage || codeMessageMap[this.code] || '伺服器錯誤';
        this.data = data;
    }
}
