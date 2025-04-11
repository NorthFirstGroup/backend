/** @format */
/**
 * 目的: 取CRUD所有使用者資料
 * 備註: TypeORM 對db使用的CRUD撰寫方式為
 *      1. 查詢資料 .find, .findOneBy
 *      2. 新增資料 .create .save
 *      3. 更新資料 .update
 *      4. 刪除資料 .delete, .remove
 */

import { Request, Response } from "express";
import { AppDataSource } from "../db";
import { User } from "../entities/User";

const userRepo = AppDataSource.getRepository(User);

//以下為範例(使用後可刪除)
export const getAllUsers = async (req: Request, res: Response) => {
    const users = await userRepo.find();
    res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
    const user = userRepo.create(req.body);
    const result = await userRepo.save(user);
    res.status(201).json(result);
};
