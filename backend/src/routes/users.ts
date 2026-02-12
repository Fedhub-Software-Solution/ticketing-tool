import { Router } from 'express';
import * as usersController from '../controllers/usersController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', requireRoles('admin', 'manager'), usersController.listUsers);
router.get('/:id', usersController.getUser);
router.patch('/:id', requireRoles('admin', 'manager'), usersController.updateUser);
export default router;
