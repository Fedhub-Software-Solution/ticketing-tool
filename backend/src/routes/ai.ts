import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authMiddleware } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.post('/parse-ticket-prompt', aiController.parseTicketPrompt);
router.post('/parse-report-prompt', aiController.parseReportPrompt);
export default router;
