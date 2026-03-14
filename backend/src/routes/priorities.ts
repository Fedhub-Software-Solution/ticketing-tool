import { Router } from 'express';
import * as prioritiesController from '../controllers/prioritiesController';
import { authMiddleware } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', prioritiesController.listPriorities);
export default router;
