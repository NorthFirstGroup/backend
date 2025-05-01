import { Router } from 'express'
import * as adminController from '../controllers/admin'

const router = Router()

// 路由定義
router.get('/areas', adminController.getAreas)

export default router