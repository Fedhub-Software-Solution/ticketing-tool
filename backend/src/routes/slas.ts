import { Router } from 'express';
import * as slasController from '../controllers/slasController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', slasController.listSlas);
router.get('/:id', slasController.getSla);
router.post('/', requireRoles('admin', 'manager'), slasController.createSla);
router.patch('/:id', requireRoles('admin', 'manager'), slasController.updateSla);
router.delete('/:id', requireRoles('admin', 'manager'), slasController.deleteSla);
export default router;
