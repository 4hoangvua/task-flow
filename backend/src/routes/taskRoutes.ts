import { Router } from 'express';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reorderTasks,
  addDependency,
  removeDependency,
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';
import { requireProjectRole, requireTaskProjectRole } from '../middlewares/rbac';

const router = Router();

// Apply auth middleware to all task routes
router.use(authMiddleware);

router.get('/', requireProjectRole(['LEADER', 'MEMBER']), getTasks);
router.post('/', requireProjectRole(['LEADER']), createTask);

// Reorder must be declared before /:id to prevent routing collision
router.patch('/reorder', requireTaskProjectRole(['LEADER', 'MEMBER']), reorderTasks);

router.get('/:id', requireTaskProjectRole(['LEADER', 'MEMBER']), getTaskById);
router.patch('/:id', requireTaskProjectRole(['LEADER']), updateTask);
router.delete('/:id', requireTaskProjectRole(['LEADER']), deleteTask);
router.patch('/:id/status', requireTaskProjectRole(['LEADER', 'MEMBER']), updateTaskStatus);

router.post('/:id/dependencies', requireTaskProjectRole(['LEADER', 'MEMBER']), addDependency);
router.delete('/:id/dependencies/:dependsOnId', requireTaskProjectRole(['LEADER', 'MEMBER']), removeDependency);

export default router;
