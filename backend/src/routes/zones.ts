import { Router } from 'express';
import * as zonesController from '../controllers/zonesController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', zonesController.listZones);
router.post('/', requireRoles('admin', 'manager'), zonesController.createZone);
router.patch('/:id', requireRoles('admin', 'manager'), zonesController.updateZone);
export default router;
