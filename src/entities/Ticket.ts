/** 票券實體類 */
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm'
import { OrderEntity } from './Order'
import { OrderTicketEntity } from './OrderTicket'
import { DbEntity } from '../constants/dbEntity'

@Entity(DbEntity.Ticket)
@Index(['created_at'])
@Index(['order_id'])
export class TicketEntity {
    /** 票券id，主鍵 */
    @PrimaryGeneratedColumn('uuid')
    id!: string

    /** 訂單id，關聯order表，禁止為空 */
    @Column({ type: 'integer', nullable: false })
    order_id!: number

    /** 訂單區域id，關聯order_tickets表，禁止為空 */
    @Column({ type: 'uuid', nullable: false })
    order_ticket_id!: string

    /** 顯示用訂單編號，禁止為空 */
    @Column({ type: 'varchar', nullable: false })
    order_number!: string

    /** 座位區域，禁止為空 */
    @Column({ type: 'varchar', nullable: false })
    section!: string

    /** 票價，禁止為空 */
    @Column({ type: 'numeric', nullable: false })
    price!: number

    /** 票券代碼，禁止為空 */
    @Column({ type: 'varchar', nullable: false })
    ticket_code!: string

    /** 使用狀態，預設為0，禁止為空 */
    @Column({ type: 'smallint', nullable: false, default: 0 })
    status!: number

    /** 電子憑證連結，禁止為空 */
    @Column({ type: 'text', nullable: false })
    certificate_url!: string

    /** 票券建立時間，預設為當前時間，禁止為空 */
    @CreateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
    })
    created_at!: Date

    /** 資料更新時間，預設為當前時間，禁止為空 */
    @UpdateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
    })
    updated_at!: Date

    /** 訂單關聯 */
    @ManyToOne(() => OrderEntity, order => order.tickets)
    @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
    order!: OrderEntity

    /** 訂單區域關聯 */
    @ManyToOne(() => OrderTicketEntity, orderTicket => orderTicket.tickets)
    @JoinColumn({ name: 'order_ticket_id', referencedColumnName: 'id' })
    orderTicket!: OrderTicketEntity
}
