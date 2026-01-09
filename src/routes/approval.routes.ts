import { Router } from 'express';
import { approvalController } from '@/controllers/approval.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
    createApprovalTemplateSchema,
    submitForApprovalSchema,
    processApprovalSchema,
    getApprovalsSchema,
} from '@/validators/approval.validator';

const router = Router();

router.use(authenticate);

router.post('/templates', validate(createApprovalTemplateSchema), async (req, res) => {
    await approvalController.createTemplate(req as any, res);
});

router.post('/submit', validate(submitForApprovalSchema), async (req, res) => {
    await approvalController.submitForApproval(req as any, res);
});

router.post('/:id/process', validate(processApprovalSchema), async (req, res) => {
    await approvalController.processApproval(req as any, res);
});

router.get('/pending', async (req, res) => {
    await approvalController.getPendingApprovals(req as any, res);
});

router.get('/summary', async (req, res) => {
    await approvalController.getSummary(req as any, res);
});

router.get('/', validate(getApprovalsSchema), async (req, res) => {
    await approvalController.getApprovals(req as any, res);
});

export default router;
