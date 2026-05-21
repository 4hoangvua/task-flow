import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import commentRoutes from './commentRoutes';
import notificationRoutes from './notificationRoutes';
import statsRoutes from './statsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);

export default router;
