import { Router } from 'express';
import { register, login, refresh, logout, getMe, updateMe, changePassword, searchUsers } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMe);
router.patch('/password', authMiddleware, changePassword);
router.get('/users/search', authMiddleware, searchUsers);

export default router;
