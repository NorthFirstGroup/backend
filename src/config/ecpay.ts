import dotenv from 'dotenv'
dotenv.config()

/** 綠界操作模式 */
export enum ECPayOperationMode {
    /** 測試環境 */
    Test = 'Test',
    /** 正式環境 */
    Production = 'Production'
}

/** 綠界設定 */
interface ECPayConfig {
    /** 特店編號 */
    MerchantID: string;
    /** 串接金鑰 */
    HashKey: string;
    /** 串接金鑰 */
    HashIV: string;
    /** 結果回傳網址，本地端可搭配 ngrok 測試 */
    ReturnURL: string;
}

const ecpayConfig: ECPayConfig = {
    MerchantID: process.env.ECPAY_MERCHANTID || '',
    HashKey: process.env.ECPAY_HASHKEEY || '',
    HashIV: process.env.ECPAY_HASHIV || '',
    ReturnURL: `${process.env.BACKEND_DDNS}/api/v1/user/ecpayNotify`
};

export const ClientDDNS = process.env.FRONTEND_DDNS || ''

export default ecpayConfig
export type { ECPayConfig }