import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    OneToMany,
    JoinColumn
} from 'typeorm';
import { DbEntity } from '../constants/dbEntity';
import { UserEntity } from './User';
import { OrderTicketEntity } from './OrderTicket';
import { TicketEntity } from './Ticket';
import { ShowtimesEntity } from './Showtimes';

/** 訂單狀態類型 */
export enum OrderStatus {
    /** 處理中 */
    PROCESSING = 'PROCESSING',
    /** 已完成 */
    COMPLETED = 'COMPLETED',
    /** 已取消 */
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
    /** 信用卡/金融卡 (藍新主要支援的類型) */
    CREDIT_CARD = 'CREDIT_CARD',
    /** 網路 ATM */
    WEB_ATM = 'WEB_ATM',
    /** 超商條碼 */
    BARCODE = 'BARCODE',
    /** 超商代碼 */
    CVS_CODE = 'CVS_CODE',
    /** 銀行轉帳 */
    BANK_TRANSFER = 'BANK_TRANSFER',
    /** 其他支付方式 */
    OTHER = 'OTHER'
}

export enum PaymentStatus {
    /** 待付款 (訂單已建立，等待用戶完成支付) */
    PENDING = 'PENDING',
    /** 支付成功 (款項已收到並確認) */
    PAID = 'PAID',
    /** 支付失敗 (支付過程中發生錯誤，款項未收到) */
    FAILED = 'FAILED',
    /** 已退款 (訂單已取消並退款) */
    REFUNDED = 'REFUNDED',
    /** 支付超時 (在規定時間內未完成支付) */
    EXPIRED = 'EXPIRED',
    /** 支付取消 (用戶主動取消支付流程) */
    CANCELLED = 'CANCELLED'
    /** 部分退款 (訂單部分退款) */
    //PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', // 可選
}

export enum PickupStatus {
    /** 未取票 (支付成功但尚未取票) */
    NOT_PICKED_UP = 'NOT_PICKED_UP',
    /** 已取票 (用戶已成功領取票券) */
    PICKED_UP = 'PICKED_UP',
    /** 已失效 (例如，因活動取消或退款導致票券失效) */
    INVALID = 'INVALID',
    /** 待處理 (如果需要人工介入處理取票，可使用此狀態) */
    PROCESSING = 'PROCESSING' // 可選
}

@Entity(DbEntity.Order)
@Index(['created_at'])
@Index(['order_number'])

/** 訂單 */
export class OrderEntity {
    /** 訂單id，主鍵 */
    @PrimaryGeneratedColumn()
    id!: number;

    /** 用戶id，關聯user表，禁止為空 */
    @Column({ type: 'uuid', nullable: false })
    user_id!: string;

    /** 場次id，關聯showtimes表，禁止為空 */
    @Column({ type: 'uuid', nullable: false })
    showtime_id!: string;

    /** 訂單編號，唯一值，禁止為空 */
    @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
    order_number!: string;

    /** 訂單狀態，預設為PROCESSING，可選值：PROCESSING|COMPLETED|CANCELLED，禁止為空 */
    @Column({
        type: 'varchar',
        length: 20,
        nullable: false,
        default: OrderStatus.PROCESSING,
        enum: OrderStatus
    })
    status!: OrderStatus;

    /** 購買張數，禁止為空 */
    @Column({ type: 'integer', nullable: false })
    total_count!: number;

    /** 總金額，精度10位小數2位，禁止為空 */
    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: false })
    total_price!: number;

    /** 付款方式，禁止為空 */
    @Column({
        type: 'varchar',
        length: 20,
        nullable: false,
        default: PaymentMethod.CREDIT_CARD,
        enum: PaymentMethod
    })
    payment_method!: PaymentMethod;

    /** 付款狀態，禁止為空 */
    @Column({
        type: 'varchar',
        length: 20,
        nullable: false,
        default: PaymentStatus.PENDING,
        enum: PaymentStatus
    })
    payment_status!: PaymentStatus;

    /** 取票狀態，禁止為空 */
    @Column({
        type: 'varchar',
        length: 20,
        nullable: false,
        default: PickupStatus.NOT_PICKED_UP,
        enum: PickupStatus
    })
    pickup_status!: PickupStatus;

    /** 訂單建立時間，預設為當前時間，禁止為空 */
    @CreateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false
    })
    created_at!: Date;

    /** 付款時間，可為空 */
    @Column({ type: 'timestamptz', nullable: true })
    paid_at!: Date;

    /** 資料更新時間，預設為當前時間，禁止為空 */
    @UpdateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false
    })
    updated_at!: Date;

    /** 一個用戶有多個訂單 */
    @ManyToOne(() => UserEntity, user => user.orders)
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user!: UserEntity;

    /** 一個場次有多個訂單 */
    @ManyToOne(() => ShowtimesEntity, showtime => showtime.orders)
    @JoinColumn({ name: 'showtime_id', referencedColumnName: 'id' })
    showtime!: ShowtimesEntity;

    /** 一張訂單有多個區域票券記錄 */
    @OneToMany(() => OrderTicketEntity, orderTicket => orderTicket.order)
    orderTickets!: OrderTicketEntity[];

    /** 一張訂單有多張票券 */
    @OneToMany(() => TicketEntity, ticket => ticket.order)
    tickets!: TicketEntity[];
}
