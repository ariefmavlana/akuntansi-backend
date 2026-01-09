import { Router } from 'express';
import { budgetController } from '@/controllers/budget.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
    createBudgetSchema,
    updateBudgetSchema,
    approveBudgetSchema,
    activateBudgetSchema,
    closeBudgetSchema,
    getBudgetsSchema,
    addBudgetDetailSchema,
    updateBudgetDetailSchema,
    deleteBudgetDetailSchema,
    createBudgetRevisionSchema,
    getBudgetVsActualSchema,
} from '@/validators/budget.validator';

const router = Router();

router.use(authenticate);

// Budget CRUD
router.post('/', validate(createBudgetSchema), async (req, res) => {
    await budgetController.create(req, res);
});

router.get('/', validate(getBudgetsSchema), async (req, res) => {
    await budgetController.getAll(req, res);
});

router.get('/:id', async (req, res) => {
    await budgetController.getById(req, res);
});

router.put('/:id', validate(updateBudgetSchema), async (req, res) => {
    await budgetController.update(req, res);
});

router.delete('/:id', async (req, res) => {
    await budgetController.delete(req, res);
});

// Approval workflow
router.post('/:id/approve', validate(approveBudgetSchema), async (req, res) => {
    await budgetController.approve(req, res);
});

router.post('/:id/activate', validate(activateBudgetSchema), async (req, res) => {
    await budgetController.activate(req, res);
});

router.post('/:id/close', validate(closeBudgetSchema), async (req, res) => {
    await budgetController.close(req, res);
});

// Budget details
router.post('/:id/details', validate(addBudgetDetailSchema), async (req, res) => {
    await budgetController.addDetail(req, res);
});

router.put('/:id/details/:detailId', validate(updateBudgetDetailSchema), async (req, res) => {
    await budgetController.updateDetail(req, res);
});

router.delete('/:id/details/:detailId', validate(deleteBudgetDetailSchema), async (req, res) => {
    await budgetController.deleteDetail(req, res);
});

// Revisions
router.post('/:id/revisions', validate(createBudgetRevisionSchema), async (req, res) => {
    await budgetController.createRevision(req, res);
});

// Analysis
router.get('/:id/vs-actual', validate(getBudgetVsActualSchema), async (req, res) => {
    await budgetController.getBudgetVsActual(req, res);
});

export default router;
