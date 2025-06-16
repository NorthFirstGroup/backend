/** 金流文件參考: https://github.com/simenkid/node-ecpay-aio/wiki */
import dayjs from 'dayjs';
import { randomUUID } from 'crypto';
import { BasePaymentParams } from 'node-ecpay-aio/dist/types';
import { Merchant, CreditOneTimePayment, isValidReceivedCheckMacValue } from 'node-ecpay-aio';
import ecpayConfig, { ECPayOperationMode, ClientDDNS } from '@/config/ecpay';

export async function createPaymentForm(orderNumber: string, totalAmount: number, itemName?: string) {
    try {
        const merchantTradeNo = randomUUID().replace(/-/g, '').slice(0, 20);
        const tradeDate = dayjs().format('YYYY/MM/DD HH:mm:ss');

        // 訂單參數
        const baseParams: BasePaymentParams = {
            MerchantTradeNo: merchantTradeNo,
            MerchantTradeDate: tradeDate,
            TotalAmount: totalAmount,
            TradeDesc: 'GoTicket 購票',
            ItemName: itemName || '測試商品',
            CustomField1: orderNumber,   // 訂單編號
            ClientBackURL: `${ClientDDNS}/user/orders/${orderNumber}`
        };

        // 選填參數
        // const params: CreditOneTimePaymentParams = {
        //     BindingCard: 1,                  // 記憶信用卡: 1 (記) | 0 (不記)
        //     MerchantMemberID: '2000132u001', // 記憶卡片需加註識別碼: MerchantId+廠商會員編號
        //     Language: undefined,             // 語系: undefined(繁中) | 'ENG' | 'KOR' | 'JPN' | 'CHI'
        //     Redeem: undefined,               // 紅利折抵: undefined(不用) | 'Y' (使用)
        //     UnionPay: 2,                     // [需申請] 銀聯卡: 0 (可用, default) | 1 (導至銀聯網) | 2 (不可用)
        // };

        const ecpay = new Merchant(ECPayOperationMode.Test, ecpayConfig);
        // 信用卡一次付款: CreditOneTimePayment,  ATM 一次付款: WebATMPayment
        const payment = ecpay.createPayment(CreditOneTimePayment , baseParams, {});
        const htmlRedirectPostForm = await payment.checkout(/* 可選填發票 */);

        return htmlRedirectPostForm;
    } catch (error) {
        console.error('訂單建立失敗:', error);
    }
}

export function verifyPayment(data: { RtnCode: string, CheckMacValue: string }) {
    try {
        if (data.RtnCode !== '1') return false;
        return isValidReceivedCheckMacValue(data, ecpayConfig.HashKey, ecpayConfig.HashIV);
    } catch (error) {
        console.log(error);
    }
}