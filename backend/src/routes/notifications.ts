import { Router } from 'express';
import * as notificationsController from '../controllers/notificationsController';
import { authMiddleware } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', notificationsController.listNotifications);
router.patch('/:id/read', notificationsController.markRead);
router.post('/read-all', notificationsController.markAllRead);

export default router;
