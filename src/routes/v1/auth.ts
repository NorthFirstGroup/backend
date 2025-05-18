import { Router } from 'express'
import * as authController from '../../controllers/auth'
import config from '../../config'
import { createAuthMiddleware } from '../../middlewares/auth'
import { dataSource } from '../../db/data-source'
import { dbEntityNameUser } from '../../entities/User'
import getLogger from '../../utils/logger'

const router = Router()

// 建立 logger
const logger = getLogger('Auth')

// 設定對Email驗證 middleware
const auth = createAuthMiddleware({
    secret: config.get('secret.jwtSecret'),
    userRepository: dataSource.getRepository(dbEntityNameUser),
    logger,
    isFindEmail: true
})

// 路由定義
router.post('/forget-password', authController.postForgetPassword)
router.post('/reset-password', auth, authController.postResetPassword)

export default router