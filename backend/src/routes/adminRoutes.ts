import { Router } from 'express';
import {
  getSystemUsers,
  updateUserSystemRole,
  updateUserActiveStatus,
  getSystemStats,
} from '../controllers/adminController';
import { authMiddleware } from '../middlewares/auth';
import { requireSystemRole } from '../middlewares/rbac';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authMiddleware);
router.use(requireSystemRole(['ADMIN']));

router.get('/users', getSystemUsers);
router.patch('/users/:id/role', updateUserSystemRole);
router.patch('/users/:id/status', updateUserActiveStatus);
router.get('/stats', getSystemStats);

export default router;
