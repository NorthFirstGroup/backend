/** @format */

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**目前為範例, 後續需刪改(完成後這行command刪掉) */
@Entity() // <-- 告訴 TypeORM：這是一張資料表
export class User {
    @PrimaryGeneratedColumn() // <-- 主鍵，會自動遞增
    id!: number;

    @Column() // <-- 普通欄位
    name!: string;

    @Column({ unique: true }) // <-- 有唯一限制
    email!: string;
}
