import { Router } from 'express';
import * as ticketsController from '../controllers/ticketsController';
import * as commentsController from '../controllers/commentsController';
import { authMiddleware } from '../middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', ticketsController.listTickets);
router.get('/:id', ticketsController.getTicket);
router.post('/', ticketsController.createTicket);
router.patch('/:id', ticketsController.updateTicket);
router.delete('/:id', ticketsController.deleteTicket);
router.get('/:id/comments', commentsController.listComments);
router.post('/:id/comments', commentsController.createComment);
router.patch('/:id/comments/:cid', commentsController.updateComment);
router.delete('/:id/comments/:cid', commentsController.deleteComment);
export default router;
