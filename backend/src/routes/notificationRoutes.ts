import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Apply auth middleware to all notification routes
router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
