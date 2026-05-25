import { Router } from 'express';
import { getCharter, updateCharter } from '../controllers/charterController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/projects/:projectId/charter — any project member
router.get('/:projectId/charter', getCharter);

// PUT /api/projects/:projectId/charter — LEADER only (checked inside controller)
router.put('/:projectId/charter', updateCharter);

export default router;
