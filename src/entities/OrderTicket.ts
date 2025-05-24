/** 訂單區域實體類 */
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm'
import { OrderEntity } from './Order'
import { TicketEntity } from './Ticket'
import { DbEntity } from '../constants/dbEntity'

@Entity(DbEntity.OrderTicket)
@Index(['created_at'])
@Index(['order_id'])
export class OrderTicketEntity {
    /** 訂單區域id，主鍵 */
    @PrimaryGeneratedColumn()
    id!: number

    /** 訂單id，關聯order表，禁止為空 */
    @Column({ type: 'integer', nullable: false })
    order_id!: number

    /** 座位區域id，禁止為空 */
    @Column({ type: 'varchar', nullable: false })
    section_id!: string

    /** 區域票券單價，禁止為空 */
    @Column({ type: 'numeric', nullable: false })
    price!: number

    /** 購買張數，禁止為空 */
    @Column({ type: 'integer', nullable: false })
    quantity!: number

    /** 票劵類型，預設為1（電子票券），禁止為空 */
    @Column({ type: 'smallint', nullable: false, default: 1 })
    ticket_type!: number

    /** 票券建立時間，預設為當前時間，禁止為空 */
    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
    })
    created_at!: Date

    /** 資料更新時間，預設為當前時間，禁止為空 */
    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
    })
    updated_at!: Date

    /** 訂單關聯 */
    @ManyToOne(() => OrderEntity, order => order.orderTickets)
    @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
    order!: OrderEntity

    /** 一張訂單有多張票券 */
    @OneToMany(() => TicketEntity, ticket => ticket.orderTicket)
    tickets!: TicketEntity[]
}
