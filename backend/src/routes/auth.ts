import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middleware';

const router = Router();
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
router.get('/me', authMiddleware, authController.me);
router.post('/change-password', authMiddleware, authController.changePassword);
export default router;
