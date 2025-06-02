import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    Index,
    OneToMany
} from 'typeorm';
import { DbEntity } from '../constants/dbEntity';
import { UserEntity } from './User';
import { ActivityEntity } from './Activity';

/** 廠商資料表 */
@Entity(DbEntity.Organizer)
export class OrganizerEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
    /** 廠商名稱 */
    @Column({ type: 'varchar', length: 100, nullable: false })
    name!: string;

    /** 用戶 ID - 關聯至 User，允許一位使用者建立一個廠商 */
    @Column({ type: 'uuid', nullable: false })
    user_id!: string;

    /** 審核狀態 */
    @Column({ type: 'smallint', default: 1, nullable: false })
    status!: number;

    /** 統一編號 */
    @Column({ type: 'varchar', length: 8, nullable: false })
    ubn!: string;

    /** 負責人 */
    @Column({ type: 'varchar', length: 20, nullable: false })
    president!: string;

    /** 電話 */
    @Column({ type: 'varchar', length: 10, nullable: false })
    phone!: string;

    /** 地址 */
    @Column({ type: 'varchar', length: 100, nullable: false })
    address!: string;

    /** 資料創建時間 */
    @CreateDateColumn({ type: 'timestamptz', nullable: false })
    @Index()
    created_at!: Date;

    /** 資料更新時間 */
    @UpdateDateColumn({ type: 'timestamptz', nullable: false })
    updated_at!: Date;

    /** 軟刪除標記 */
    @Column({ type: 'boolean', default: false, nullable: false })
    is_deleted!: boolean;

    // 與 User 的一對一關聯
    @OneToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user!: UserEntity;

    // 🔁 多個活動關聯
    @OneToMany(() => ActivityEntity, activity => activity.organizer)
    activities!: ActivityEntity[];
}
