import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DbEntity } from '../constants/dbEntity';

/** 活動類別 */
@Entity(DbEntity.ActivityType)
export class ActivityTypeEntity {
  /** 類別ID */
  @PrimaryGeneratedColumn({ type: 'integer'})
  id!: number;

  /** 類別名稱 */
  @Column({ type: 'varchar', length: 20, nullable: false, unique: true})
  name!: string;

  /** 啟用狀態 */
  @Column({ type: 'boolean', default: true, nullable: false })
  is_active!: boolean;

  /** 建立時間 */
  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  created_at!: Date;

  /** 更新時間  */
  @UpdateDateColumn({ type: 'timestamptz', nullable: false })
  updated_at!: Date;

  /* 軟刪除標記*/
  @Column('boolean', { nullable: false, default: false })
  is_deleted!: boolean;
}
