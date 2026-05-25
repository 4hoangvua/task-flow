import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  updateProjectMember,
  deleteProjectMember,
  exportProjectCSV,
} from '../controllers/projectController';
import { getLabels, createLabel } from '../controllers/labelController';
import { authMiddleware } from '../middlewares/auth';
import { requireSystemRole, requireProjectRole } from '../middlewares/rbac';

const router = Router();

// Apply auth middleware to all project routes
router.use(authMiddleware);

router.get('/', getProjects);
router.post('/', requireSystemRole(['LEADER']), createProject);

router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/export', requireProjectRole(['LEADER']), exportProjectCSV);

// Project member sub-routes
router.get('/:id/members', requireProjectRole(['LEADER', 'MEMBER']), getProjectMembers);
router.post('/:id/members', requireProjectRole(['LEADER']), addProjectMember);
router.patch('/:id/members/:uid', requireProjectRole(['LEADER']), updateProjectMember);
router.delete('/:id/members/:uid', requireProjectRole(['LEADER']), deleteProjectMember);

// Project label sub-routes
router.get('/:id/labels', requireProjectRole(['LEADER', 'MEMBER']), getLabels);
router.post('/:id/labels', requireProjectRole(['LEADER']), createLabel);

export default router;
