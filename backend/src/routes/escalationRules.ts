import { Router } from 'express';
import * as escalationRulesController from '../controllers/escalationRulesController';
import { authMiddleware, requireRoles } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', escalationRulesController.listRules);
router.post('/', requireRoles('admin', 'manager'), escalationRulesController.createRule);
router.patch('/:id', requireRoles('admin', 'manager'), escalationRulesController.updateRule);
router.delete('/:id', requireRoles('admin', 'manager'), escalationRulesController.deleteRule);
export default router;
