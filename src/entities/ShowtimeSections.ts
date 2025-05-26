// 活動場次明細表，各分區票價資料包含座位數與剩餘數量

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  Index 
} from 'typeorm';
import { ShowtimesEntity } from './Showtimes';
import { ActivitySiteEntity } from './ActivitySite';
import { ActivityEntity } from './Activity';

import { DbEntity } from '../constants/dbEntity';


/** 活動場次明細表，各分區票價資料包含座位數與剩餘數量 */
@Entity(DbEntity.ShowtimeSsections)
export class ShowtimeSectionsEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string; // 場次票價分區id

    @Column({ type: 'uuid', nullable: false })
    showtime_id!: string; // 場次 id

    @Column({ type: 'uuid', nullable: false })
    site_id!: string; // 場地id

    @Column({ type: 'integer', nullable: false })
    activity_id!: number; // 活動id

    @Column({ type: 'varchar', length: 20, nullable: false })
    section!: string; // 座位區域，廠商設定的分區

    @Column({ type: 'integer', nullable: true })
    price!: number | null; // 座位價格，廠商設定的分區票價

    @Column({ type: 'integer', nullable: true })
    capacity!: number | null; // 座位總數量，各分區的座位數，應由 activity_site 的 prices 資料帶過來

    @Column({ type: 'integer', nullable: true })
    vacancy!: number | null; // 座位剩餘數量

    @CreateDateColumn({ type: 'timestamptz', nullable: false })
    @Index()
    created_at!: Date; // 資料創建時間，預設為當前時間

    @UpdateDateColumn({ type: 'timestamptz', nullable: false })
    updated_at!: Date; // 資料更新時間，預設為當前時間

    // 與 Showtimes 的多對一關聯
    @ManyToOne(() => ShowtimesEntity, showtime => showtime.showtimeSections)
    @JoinColumn({ name: 'showtime_id', referencedColumnName: 'id' })
    showtime!: ShowtimesEntity;

    // 與 ActivitySite 的多對一關聯
    @ManyToOne(() => ActivitySiteEntity, site => site.showtimeSections)
    @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
    site!: ActivitySiteEntity;

    // 與 Activity 的多對一關聯
    @ManyToOne(() => ActivityEntity, activity => activity.showtimeSections )
    @JoinColumn({ name: 'activity_id', referencedColumnName: 'id' })
    activity!: ActivityEntity;
}



