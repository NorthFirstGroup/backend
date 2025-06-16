import { OrderStatus, PickupStatus } from '../entities/Order';


export const OrderStatusMap: Record<OrderStatus, string> = {
  [OrderStatus.PROCESSING]: '處理中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消'
};



export const PickupStatusMap: Record<PickupStatus, string> = {
  [PickupStatus.NOT_PICKED_UP]: '未取票',
  [PickupStatus.PICKED_UP]: '已取票',
  [PickupStatus.INVALID]: '已失效',
  [PickupStatus.PROCESSING]: '待處理',
  // [PickupStatus.OVERDUE]: '逾期', // 逾期 (超過取票期限仍未取票)
};

