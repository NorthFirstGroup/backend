import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { AreaEntity } from './Area'
import { OrderEntity } from './Order';

/** 使用者角色類型 */
export enum UserRole {
    /** 一般使用者 */
    USER = 'USER',
    /** 活動廠商 */
    ORGANIZER = 'ORGANIZER',
    /** 管理者 */
    ADMIN = 'ADMIN',
}

/** 資料庫用的 Entity 名稱 */
export const dbEntityNameUser = 'User'

@Entity(dbEntityNameUser)
export class UserEntity {
    /** uuid */
    @PrimaryGeneratedColumn('uuid')
    id!: string;
    /** 名稱 */
    @Column({ type: 'varchar', length: 20, nullable: false })
    nick_name!: string;

    /** 等同帳號 */
    @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
    email!: string;

    /** 密碼 */
    @Column({ type: 'varchar', length: 255, nullable: false, select: false })
    password_hash!: string;

    /** 狀態 1: 開通, 0: 未開通 */
    @Column({ type: 'int', nullable: false, default: 0 })
    status!: number;

    /** 角色類型 UserRole */
    @Column({ type: 'varchar', length: 20, nullable: false, default: UserRole.USER })
    role!: string;

    /** 手機號碼 */
    @Column({ type: 'varchar', length: 10, nullable: true })
    phone!: string;

    /** 生日 */
    @Column({ type: 'date', nullable: true })
    birth_date!: Date;

    /** 頭像 */
    @Column({ type: 'text', nullable: true })
    profile_url!: string;

    /** 建立時間 */
    @CreateDateColumn({ type: 'timestamptz', nullable: false })
    created_at!: Date;

    /** 更新時間 */
    @UpdateDateColumn({ type: 'timestamptz', nullable: false })
    updated_at!: Date;

    /** 軟刪除標記 */
    @Column({ type: 'boolean', nullable: false, default: false })
    is_deleted!: boolean;

    /** 偏好活動地區(多對多) */
    @ManyToMany(() => AreaEntity, area => area.users)
    @JoinTable({
        name: 'User_Area',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'area_id', referencedColumnName: 'id' },
    })
    location_ids!: AreaEntity[];

    /** 一個用戶有多個訂單 */
    @OneToMany(() => OrderEntity, order => order.user)
    orders!: OrderEntity[];
}