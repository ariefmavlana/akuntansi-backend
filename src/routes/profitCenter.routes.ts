import { Router } from 'express';
import { profitCenterController } from '@/controllers/profitCenter.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
    createProfitCenterSchema,
    updateProfitCenterSchema,
    getProfitCentersSchema,
    getProfitCenterByIdSchema,
    deleteProfitCenterSchema,
    getProfitCenterPerformanceSchema,
} from '@/validators/profitCenter.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProfitCenterSchema), async (req, res) => {
    await profitCenterController.create(req, res);
});

router.get('/', validate(getProfitCentersSchema), async (req, res) => {
    await profitCenterController.getAll(req, res);
});

router.get('/:id', validate(getProfitCenterByIdSchema), async (req, res) => {
    await profitCenterController.getById(req, res);
});

router.put('/:id', validate(updateProfitCenterSchema), async (req, res) => {
    await profitCenterController.update(req, res);
});

router.delete('/:id', validate(deleteProfitCenterSchema), async (req, res) => {
    await profitCenterController.delete(req, res);
});

router.get('/:id/performance', validate(getProfitCenterPerformanceSchema), async (req, res) => {
    await profitCenterController.getPerformance(req, res);
});

export default router;
