import { Router } from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentController';
import { authMiddleware } from '../middlewares/auth';
import { requireTaskProjectRole } from '../middlewares/rbac';

const router = Router();

// Apply auth middleware to all comment routes
router.use(authMiddleware);

// Get comments for a task & add a comment
router.get('/tasks/:id/comments', requireTaskProjectRole(['LEADER', 'MEMBER']), getComments);
router.post('/tasks/:id/comments', requireTaskProjectRole(['LEADER', 'MEMBER']), createComment);

// Delete comment (author check is done within the controller)
router.delete('/comments/:id', deleteComment);

export default router;
