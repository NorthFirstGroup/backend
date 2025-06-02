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
router.get('/activity', auth, isOrganizer, organizerController.getActivity)
router.get('/activity/:activity_id', auth, isOrganizer, organizerController.getActivityById)
router.post('/upload/image', auth, isOrganizer, organizerController.postUploadImage)


// 取得廠商單一活動場次
router.get('/activity/:activity_id/showtime', auth, isOrganizer, organizerController.getActivityShowtimes)
// 新增廠商活動場次
router.post('/activity/:activity_id/showtime', auth, isOrganizer, organizerController.postActivityShowtime)
// 更新活動場次
router.put('/activity/:activity_id/showtime/:showtime_id', auth, isOrganizer, organizerController.putActivityShowtime)
// 刪除活動場次
router.delete('/activity/:activity_id/showtime/:showtime_id', auth, isOrganizer, organizerController.deleteActivityShowtime)
// 取得票券座位資料
router.get('/activity/ticket/:ticket_id', auth, isOrganizer, organizerController.getTicket)
// 票券座位狀態改為已使用
router.put('/activity/ticket/:ticket_id', auth, isOrganizer, organizerController.putTicket)








export default router