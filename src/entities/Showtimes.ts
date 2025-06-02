// 活動場次資料表

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    OneToMany
} from 'typeorm';
import { ActivityEntity } from './Activity';
import { ActivitySiteEntity } from './ActivitySite';
import { ShowtimeSectionsEntity } from './ShowtimeSections';

import { DbEntity } from '../constants/dbEntity';
import { OrderEntity } from './Order';

@Entity(DbEntity.Showtimes)
export class ShowtimesEntity {
    // 場次 id（主鍵）
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // 場地 id（外鍵對應 ActivitySiteEntity）
    @Column({ type: 'uuid', nullable: false })
    site_id!: string;

    // 活動 id（外鍵對應 ActivityEntity）
    @Column({ type: 'integer', nullable: false })
    activity_id!: number;

    // 場次開始時間
    @Column({ type: 'timestamptz', nullable: true })
    start_time!: Date;

    // 座位圖片連結
    @Column({ type: 'text', nullable: true })
    seat_image!: string;

    // 資料創建時間（預設為當前時間）
    @CreateDateColumn({ type: 'timestamptz', nullable: false })
    @Index()
    created_at!: Date;

    // 資料更新時間（預設為當前時間）
    @UpdateDateColumn({ type: 'timestamptz', nullable: false })
    updated_at!: Date;

    // 關聯至活動（多對一）
    @ManyToOne(() => ActivityEntity, activity => activity.showtimes)
    @JoinColumn({ name: 'activity_id', referencedColumnName: 'id' })
    activity!: ActivityEntity;

    // 關聯至場地（多對一）
    @ManyToOne(() => ActivitySiteEntity, site => site.showtimes)
    @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
    site!: ActivitySiteEntity;

    // 🔁 一對多：一場次有多個區域票價
    @OneToMany(() => ShowtimeSectionsEntity, section => section.showtime)
    showtimeSections!: ShowtimeSectionsEntity[];

    /** 一場次有多個張訂單 */
    @OneToMany(() => OrderEntity, order => order.showtime)
    orders!: Promise<OrderEntity[]>;
}
