import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm'
import { UserEntity } from './User'

/** 資料庫用的 Entity 名稱 */
export const dbEntityNameArea = 'Area'

/** Area 資料表對應的型別結構 */
export interface Area {
    /** 整數自動遞增 */
    id: number
    /** 地區名稱 */
    name: string
    /** 建立時間 */
    created_at: Date
    /** 更新時間 */
    updated_at: Date
}

@Entity(dbEntityNameArea)
/** 地區 Entity 定義 */
export class AreaEntity { 
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'varchar', length: 100, nullable: false })
    name!: string

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date

    @UpdateDateColumn({ type: 'timestamp', nullable: false })
    updated_at!: Date

    @ManyToMany(() => UserEntity, (user) => user.location_ids) // 反向關聯
    users!: UserEntity[]
}


/** 未關聯前 schema 寫法如下 */

// export const AreaEntity = new EntitySchema<Area>({
//     name: dbEntityNameArea,
//     tableName: 'Area',
//     columns: {
//         id: {
//             primary: true,
//             type: 'int',
//             generated: 'increment',
//         },
//         name: {
//             type: 'varchar',
//             length: 100,
//             nullable: false,
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
//     },
// })