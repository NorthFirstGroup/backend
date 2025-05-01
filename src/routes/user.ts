import { Router } from 'express'
import config from '../config'
import { dataSource } from '../db/data-source'
import getLogger from '../utils/logger'
import * as userController from '../controllers/user'
import { createAuthMiddleware } from '../middlewares/auth'
import { dbEntityNameUser } from '../entities/User'

const router = Router()

// 建立 logger
const logger = getLogger('User')

// 設定驗證 middleware
const auth = createAuthMiddleware({
    secret: config.get('secret.jwtSecret'),
    userRepository: dataSource.getRepository(dbEntityNameUser),
    logger,
})

// 路由定義
router.post('/signup', userController.postSignup)
router.post('/signin', userController.postSignin)
router.get('/profile', auth, userController.getProfile)
router.put('/profile', auth, userController.putProfile)
router.put('/password', auth, userController.putPassword)

export default router