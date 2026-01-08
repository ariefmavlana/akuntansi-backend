import { Router } from 'express';
import { approvalController } from '@/controllers/approval.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    createApprovalTemplateSchema,
    submitForApprovalSchema,
    processApprovalSchema,
    getApprovalsSchema,
} from '@/validators/approval.validator';

const router = Router();

router.use(authenticate);

router.post('/templates', validate(createApprovalTemplateSchema), async (req, res) => {
    await approvalController.createTemplate(req, res);
});

router.post('/submit', validate(submitForApprovalSchema), async (req, res) => {
    await approvalController.submitForApproval(req, res);
});

router.post('/:id/process', validate(processApprovalSchema), async (req, res) => {
    await approvalController.processApproval(req, res);
});

router.get('/pending', async (req, res) => {
    await approvalController.getPendingApprovals(req, res);
});

router.get('/', validate(getApprovalsSchema), async (req, res) => {
    await approvalController.getApprovals(req, res);
});

export default router;
