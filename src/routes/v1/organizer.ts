import { Router } from 'express'
import config from '../../config'
import { dataSource } from '../../db/data-source'
import getLogger from '../../utils/logger'
import * as organizerController from '../../controllers/organizer'
import { createAuthMiddleware } from '../../middlewares/auth'
import { dbEntityNameUser } from '../../entities/User'
import { isOrganizer } from '../../middlewares/isOrganizer'

const router = Router()

// 建立 logger
const logger = getLogger('Organizer')

// 設定驗證 middleware
const auth = createAuthMiddleware({
    secret: config.get('secret.jwtSecret'),
    userRepository: dataSource.getRepository(dbEntityNameUser),
    logger,
})

// 路由定義
router.post('/apply', auth, isOrganizer, organizerController.postApply)
router.post('/upload/image', auth, isOrganizer, organizerController.postUploadImage)

export default router