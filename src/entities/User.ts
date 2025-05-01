import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { AreaEntity } from './Area'

/** 使用者角色類型 */
export enum UserRole {
    /** 一般使用者 */
    USER = 'USER',
    /** 活動廠商 */
    ORGANIZER = 'ORGANIZER',
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
    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

    /** 更新時間 */
    @UpdateDateColumn({ type: 'timestamp', nullable: false })
    updated_at!: Date;

    /** 軟刪除標記 */
    @Column({ type: 'boolean', nullable: false, default: false })
    is_deleted!: boolean;

    /** 偏好活動地區(多對多) */
    @ManyToMany(() => AreaEntity, (area) => area.users)
    @JoinTable({
        name: 'User_Area',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'area_id', referencedColumnName: 'id' },
    })
    location_ids!: AreaEntity[];
}

/** 未關聯前 schema 寫法如下 */

/** User 資料表對應的型別結構 */
// export interface User {
//     /** uuid */
//     id: string
//     /** 名稱 */
//     nick_name: string
//     /** 等同帳號 */
//     email: string
//     /** 密碼 */
//     password_hash: string
//     /** 狀態 1: 開通, 0: 未開通 */
//     status: number
//     /** 角色類型 UserRole */
//     role: UserRole
//     /** 手機號碼 */
//     phone: string
//     /** 生日 */
//     birth_date: Date
//     /** 偏好活動地區 */
//     location_ids: number[]
//     /** 頭像 */
//     profile_url: string
//     /** 建立時間 */
//     created_at: Date
//     /** 更新時間 */
//     updated_at: Date
//     /** 軟刪除標記 */
//     is_deleted: boolean
// }

/** 使用者 Entity 定義 */
// export const UserEntity = new EntitySchema<User>({
//     name: dbEntityNameUser,
//     tableName: 'USER',
//     columns: {
//         id: {
//             primary: true,
//             type: 'uuid',
//             generated: 'uuid',
//         },
//         nick_name: {
//             type: 'varchar',
//             length: 20,
//             nullable: false,
//         },
//         email: {
//             type: 'varchar',
//             length: 100,
//             nullable: false,
//             unique: true,
//         },
//         password_hash: {
//             type: 'varchar',
//             length: 255,
//             nullable: false,
//             select: false,
//         },
//         status: {
//             type: 'int',
//             nullable: false,
//             default: 0,
//         },
//         role: {
//             type: 'varchar',
//             length: 20,
//             nullable: false,
//             default: UserRole.USER,
//         },
//         phone: {
//             type: 'varchar',
//             length: 10,
//             nullable: true,
//         },
//         birth_date: {
//             type: 'date',
//             nullable: true,
//         },
//         location_ids: {
//             type: 'int',
//             array: true,
//             nullable: true,
//         },
//         profile_url: {
//             type: 'text',
//             nullable: true,
//         },
//         created_at: {
//             type: 'timestamp',
//             createDate: true,
//             nullable: false,
//         },
//         updated_at: {
//             type: 'timestamp',
//             updateDate: true,
//             nullable: false,
//         },
//         is_deleted: {
//             type: 'boolean',
//             nullable: false,
//             default: false,
//         },
//     }
// })
