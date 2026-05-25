import { Router } from 'express';
import { createSubtask, updateSubtask, deleteSubtask } from '../controllers/subtaskController';
import { authMiddleware } from '../middlewares/auth';
import { requireTaskProjectRole } from '../middlewares/rbac';

const router = Router();

router.use(authMiddleware);

// Create subtask under a task: Task ID is passed as :id to leverage requireTaskProjectRole middleware
router.post('/tasks/:id/subtasks', requireTaskProjectRole(['LEADER', 'MEMBER']), createSubtask);

// Update/Delete subtask by subtask ID (membership check is done inside controller)
router.patch('/:id', updateSubtask);
router.delete('/:id', deleteSubtask);

export default router;
