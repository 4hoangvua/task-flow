import { Router } from 'express';
import { getProjectStats, getMySummary } from '../controllers/statsController';
import { authMiddleware } from '../middlewares/auth';
import { requireProjectRole } from '../middlewares/rbac';

const router = Router();

// Apply auth middleware to all stats routes
router.use(authMiddleware);

router.get('/my-summary', getMySummary);
router.get('/project/:id', requireProjectRole(['LEADER', 'MEMBER']), getProjectStats);

export default router;
