// 活動場地資料表
// 補: 場地與場次會有一對多的關係 (一個場地可以辦多個場次)

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { ActivityEntity } from './Activity';
import { AreaEntity } from './Area';
import { ShowtimesEntity } from './Showtimes';
import { ShowtimeSectionsEntity } from './ShowtimeSections';

import { DbEntity } from '../constants/dbEntity';

@Entity(DbEntity.ActivitySite)
export class ActivitySiteEntity {
    @PrimaryGeneratedColumn('uuid')
    // 場地ID
    id!: string;

    // 活動ID
    @Column({ type: 'integer', nullable: false })
    activity_id!: number;

    // 區域ID
    @Column({ type: 'integer', nullable: false })
    area_id!: number;

    // 場地名稱
    @Column({ type: 'varchar', length: 100, nullable: false })
    name!: string;

    // 活動地址
    @Column({ type: 'varchar', length: 100, nullable: false })
    address!: string;

    // 分區座位示意圖網址
    @Column({ type: 'text', nullable: false })
    seating_map_url!: string;

    // 場地可容納最大人數
    @Column({ type: 'integer', nullable: false })
    seat_capacity!: number;

    // 分區票價設定，含區域、單價、人數限制
    @Column({ type: 'jsonb', nullable: false })
    prices!: {
        section: string;
        price: number;
        capacity: number;
    }[];

    // 資料創建時間
    @CreateDateColumn({ type: 'timestamptz' })
    @Index()
    created_at!: Date;

    // 資料更新時間
    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at!: Date;

    // 活動關聯
    @ManyToOne(() => ActivityEntity)
    @JoinColumn({ name: 'activity_id', referencedColumnName: 'id' })
    activity!: ActivityEntity;

    @ManyToOne(() => AreaEntity)
    @JoinColumn({ name: 'area_id', referencedColumnName: 'id' })
    // 區域關聯
    area!: AreaEntity;

    // 🔁 一對多：一場地有多個場次
    @OneToMany(() => ShowtimesEntity, showtime => showtime.site)
    showtimes!: ShowtimesEntity[];

    @OneToMany(() => ShowtimeSectionsEntity, section => section.site)
    showtimeSections!: ShowtimeSectionsEntity[];
}
