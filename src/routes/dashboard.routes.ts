import { Router } from 'express';
import { dashboardController } from '@/controllers/dashboard.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticate, (req, res, next) => dashboardController.getStats(req, res, next));
router.get('/widgets', authenticate, (req, res, next) => dashboardController.getWidgets(req, res, next));
router.post('/widgets', authenticate, (req, res, next) => dashboardController.createWidget(req, res, next));
router.delete('/widgets/:id', authenticate, (req, res, next) => dashboardController.deleteWidget(req, res, next));

export default router;
