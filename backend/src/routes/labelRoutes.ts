import { Router } from 'express';
import { updateLabel, deleteLabel } from '../controllers/labelController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// Label ID specific routes (leader permission checked inside controller)
router.patch('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
