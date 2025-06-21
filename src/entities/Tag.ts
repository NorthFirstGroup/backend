import { Entity, Index, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ActivityEntity } from '@entities/Activity';
import { DbEntity } from '../constants/dbEntity';

@Entity(DbEntity.Tag)
@Index(['activity_id', 'name'], { unique: true }) // Prevent duplicate tags for the same activity
export class TagEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'integer', nullable: false })
    activity_id!: number;

    @Column({ type: 'varchar', length: 20, nullable: false })
    name!: string;

    @Column({ type: 'integer', nullable: false, default: 0 })
    level!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at!: Date;

    // 關聯到活動實體
    @ManyToOne(() => ActivityEntity, activity => activity.tags, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'activity_id', referencedColumnName: 'id' })
    activity!: ActivityEntity;
}
