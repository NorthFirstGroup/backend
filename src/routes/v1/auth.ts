import { Router } from 'express'
import * as authController from '../../controllers/auth'

const router = Router()

// 路由定義
router.post('/forget-password', authController.postForgetPassword)
router.post('/reset-password', authController.postResetPassword)

export default router