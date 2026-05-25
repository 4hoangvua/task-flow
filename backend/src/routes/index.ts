import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import commentRoutes from './commentRoutes';
import notificationRoutes from './notificationRoutes';
import statsRoutes from './statsRoutes';
import adminRoutes from './adminRoutes';
import subtaskRoutes from './subtaskRoutes';
import labelRoutes from './labelRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);
router.use('/subtasks', subtaskRoutes);
router.use('/labels', labelRoutes);

export default router;
