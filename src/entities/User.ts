import { EntitySchema } from 'typeorm'

/** 使用者角色類型 */
export enum UserRole {
    /** 一般使用者 */
    USER = 'USER',
    /** 活動廠商 */
    COMPANY = 'COMPANY',
}

/** User 資料表對應的型別結構 */
export interface User {
    /**  */
    id: string
    /** 名稱 */
    name: string
    /** 電子信箱 */
    email: string
    /** 角色類型 UserRole */
    role: UserRole
    /** 密碼 */
    password: string
    /** 建立時間 */
    created_at: Date
    /** 更新時間 */
    updated_at: Date
}

/** 資料庫用的 Entity 名稱 */
export const dbEntityNameUser = 'User'

/** 使用者 Entity 定義 */
export const UserEntity = new EntitySchema<User>({
    name: dbEntityNameUser,
    tableName: 'USER',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        name: {
            type: 'varchar',
            length: 50,
            nullable: false,
        },
        email: {
            type: 'varchar',
            length: 320,
            nullable: false,
            unique: true,
        },
        role: {
            type: 'varchar',
            length: 20,
            nullable: false,
        },
        password: {
            type: 'varchar',
            length: 72,
            nullable: false,
            select: false,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false,
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
            nullable: false,
        },
    },
})
