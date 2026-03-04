import { Router } from 'express';
import * as ticketStatusesController from '../controllers/ticketStatusesController';
import { authMiddleware } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', ticketStatusesController.listTicketStatuses);
router.get('/:id', ticketStatusesController.getTicketStatus);
export default router;
