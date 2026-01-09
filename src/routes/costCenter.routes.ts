import { Router } from 'express';
import { costCenterController } from '@/controllers/costCenter.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
    createCostCenterSchema,
    updateCostCenterSchema,
    getCostCentersSchema,
    getCostCenterByIdSchema,
    deleteCostCenterSchema,
    getCostCenterTransactionsSchema,
} from '@/validators/costCenter.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCostCenterSchema), async (req, res) => {
    await costCenterController.create(req, res);
});

router.get('/', validate(getCostCentersSchema), async (req, res) => {
    await costCenterController.getAll(req, res);
});

router.get('/:id', validate(getCostCenterByIdSchema), async (req, res) => {
    await costCenterController.getById(req, res);
});

router.put('/:id', validate(updateCostCenterSchema), async (req, res) => {
    await costCenterController.update(req, res);
});

router.delete('/:id', validate(deleteCostCenterSchema), async (req, res) => {
    await costCenterController.delete(req, res);
});

router.get('/:id/transactions', validate(getCostCenterTransactionsSchema), async (req, res) => {
    await costCenterController.getTransactions(req, res);
});

export default router;
