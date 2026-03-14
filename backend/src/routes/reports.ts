import { Router } from 'express';
import * as reportsController from '../controllers/reportsController';
import { authMiddleware } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/summary', reportsController.reportSummary);
router.get('/regional', reportsController.reportRegional);
router.get('/dashboard', reportsController.reportDashboard);
export default router;
