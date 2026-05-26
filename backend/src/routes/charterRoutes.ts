import { Router } from 'express';
import { getCharter, updateCharter } from '../controllers/charterController';
import { authMiddleware } from '../middlewares/auth';
import { requireProjectRole } from '../middlewares/rbac';

const router = Router();

router.use(authMiddleware);

// GET /api/projects/:projectId/charter — any project member
router.get('/:projectId/charter', requireProjectRole(['LEADER', 'MEMBER']), getCharter);

// PUT /api/projects/:projectId/charter — LEADER only
router.put('/:projectId/charter', requireProjectRole(['LEADER']), updateCharter);

export default router;
