import { Router } from 'express';
import userRouter from '@routes/v2/user';

const router = Router();

// v2 路由可以在這裡添加
router.use('/user', userRouter);
export default router;
