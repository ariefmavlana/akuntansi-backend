import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticate, DashboardController.getStats);
router.get('/widgets', authenticate, DashboardController.getWidgets);
router.post('/widgets', authenticate, DashboardController.createWidget);
router.delete('/widgets/:id', authenticate, DashboardController.deleteWidget);

export default router;
