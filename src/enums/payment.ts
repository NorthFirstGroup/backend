import { OrderStatus, PaymentMethod, PaymentStatus, PickupStatus, OrderEntity } from '../entities/Order';

// 付款狀態中文對應映射
export const PaymentStatusMap: { [key in PaymentStatus]: string } = {
  [PaymentStatus.PENDING]: '待付款',
  [PaymentStatus.PAID]: '已付款',
  [PaymentStatus.FAILED]: '支付失敗',
  [PaymentStatus.REFUNDED]: '已退款',
  [PaymentStatus.EXPIRED]: '支付超時',
  [PaymentStatus.CANCELLED]: '支付取消'
};

export const PaymentMethodLabelMap: Record<PaymentMethod, string> = {
  [PaymentMethod.CREDIT_CARD]: '信用卡',
  [PaymentMethod.WEB_ATM]: '網路 ATM',
  [PaymentMethod.BARCODE]: '超商付款',
  [PaymentMethod.CVS_CODE]: '超商付款',
  [PaymentMethod.BANK_TRANSFER]: '銀行轉帳',
  [PaymentMethod.OTHER]: '其他',
};




