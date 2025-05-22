import { Router } from 'express'
import config from '../../config'
import { dataSource } from '../../db/data-source'
import getLogger from '../../utils/logger'
import * as frontpageController from '../../controllers/frontpage'
import { createAuthMiddleware } from '../../middlewares/auth'
import { dbEntityNameUser } from '../../entities/User'

const router = Router()

// 建立 logger
const logger = getLogger('Frontpage')

// 設定驗證 middleware
const auth = createAuthMiddleware({
    secret: config.get('secret.jwtSecret'),
    userRepository: dataSource.getRepository(dbEntityNameUser),
    logger,
})

// 路由定義
router.get('/top', frontpageController.getTop)
router.get('/hot-topics', frontpageController.getHotTopics)

export default router