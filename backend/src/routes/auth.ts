import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middleware';

const router = Router();
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.me);
export default router;
