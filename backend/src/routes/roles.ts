import { Router } from 'express';
import * as rolesController from '../controllers/rolesController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', rolesController.listRoles);
router.post('/', requireRoles('admin', 'manager'), rolesController.createRole);
router.patch('/:id', requireRoles('admin', 'manager'), rolesController.updateRole);
router.delete('/:id', requireRoles('admin', 'manager'), rolesController.deleteRole);
export default router;
