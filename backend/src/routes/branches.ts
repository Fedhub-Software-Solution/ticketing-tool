import { Router } from 'express';
import * as branchesController from '../controllers/branchesController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', branchesController.listBranches);
router.post('/', requireRoles('admin', 'manager'), branchesController.createBranch);
router.patch('/:id', requireRoles('admin', 'manager'), branchesController.updateBranch);
router.delete('/:id', requireRoles('admin', 'manager'), branchesController.deleteBranch);
export default router;
