import { Router } from 'express';
import config from '../../config';
import { dataSource } from '@db/data-source';
import getLogger from '@utils/logger';
import * as organizerController from '@controllers/organizer';
import { createAuthMiddleware } from '@middlewares/auth';
import { dbEntityNameUser } from '@entities/User';
import { organizerActivityCtrl, organizerSiteCtrl } from '@controllers/organizer';
import { isActivityOwner, isOrganizer } from '@middlewares/organizer';

const router = Router();

// 建立 logger
const logger = getLogger('Organizer');

// 設定驗證 middleware
const auth = createAuthMiddleware({
    secret: config.get('secret.jwtSecret'),
    userRepository: dataSource.getRepository(dbEntityNameUser),
    logger
});

router.post('/upload/image', auth, isOrganizer, organizerController.postUploadImage);

//  活動管理
// 51. GET - /api/v1/organizer/activity
// 52. GET - /api/v1/organizer/activity
// 53. POST - /api/v1/organizer/activity
// 54. PUT - /api/v1/organizer/activity/:activityId
// 55. DELETE - /api/v1/organizer/activity/:activityId
router.get('/activity', auth, isOrganizer, organizerController.getActivity);
router.get('/activity/:activity_id', auth, isOrganizer, organizerController.getActivityById);
router.post('/activity', auth, isOrganizer, organizerActivityCtrl.create);
router
    .route('/activity/:activityId')
    .put(auth, isActivityOwner, organizerActivityCtrl.update)
    .delete(auth, isActivityOwner, organizerActivityCtrl.delete);

// 場地管理
//56. GET - /api/v1/organizer/activity/:activityId/site
//57. POST - /api/v1/organizer/activity/:activityId/site
//58. PUT - /api/v1/organizer/activity/:activityId/site/:siteId
//59. DELETE - /api/v1/organizer/activity/:activityId/site/:siteId
router
    .route('/activity/:activityId/site')
    .get(auth, isActivityOwner, organizerSiteCtrl.getByActivityId)
    .post(auth, isActivityOwner, organizerSiteCtrl.create);
router
    .route('/activity/:activityId/site/:siteId')
    .put(auth, isActivityOwner, organizerSiteCtrl.update)
    .delete(auth, isActivityOwner, organizerSiteCtrl.delete);

export default router;
