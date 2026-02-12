import { Router } from 'express';
import * as enterpriseController from '../controllers/enterpriseController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', enterpriseController.getEnterprise);
router.patch('/', requireRoles('admin', 'manager'), enterpriseController.updateEnterprise);
export default router;
