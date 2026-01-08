import { Router } from 'express';
import { auditController } from '@/controllers/audit.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
    getAuditLogsSchema,
    getAuditLogSchema,
    getAuditByRecordSchema,
    getUserActivitySchema,
} from '@/validators/audit.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all audit logs
router.get(
    '/',
    validate(getAuditLogsSchema),
    auditController.getAll.bind(auditController)
);

// Get audit logs for specific record (history)
router.get(
    '/record',
    validate(getAuditByRecordSchema),
    auditController.getByRecord.bind(auditController)
);

// Get user activity timeline
router.get(
    '/user/:userId',
    validate(getUserActivitySchema),
    auditController.getUserActivity.bind(auditController)
);

// Get single audit log
router.get(
    '/:id',
    validate(getAuditLogSchema),
    auditController.getById.bind(auditController)
);

export default router;
