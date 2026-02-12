import { Router } from 'express';
import * as categoriesController from '../controllers/categoriesController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', categoriesController.listCategories);
router.post('/', requireRoles('admin', 'manager'), categoriesController.createCategory);
router.patch('/:id', requireRoles('admin', 'manager'), categoriesController.updateCategory);
router.delete('/:id', requireRoles('admin', 'manager'), categoriesController.deleteCategory);
export default router;
