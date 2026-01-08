"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const audit_validator_1 = require("../validators/audit.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get all audit logs
router.get('/', (0, validation_middleware_1.validate)(audit_validator_1.getAuditLogsSchema), audit_controller_1.auditController.getAll.bind(audit_controller_1.auditController));
// Get audit logs for specific record (history)
router.get('/record', (0, validation_middleware_1.validate)(audit_validator_1.getAuditByRecordSchema), audit_controller_1.auditController.getByRecord.bind(audit_controller_1.auditController));
// Get user activity timeline
router.get('/user/:userId', (0, validation_middleware_1.validate)(audit_validator_1.getUserActivitySchema), audit_controller_1.auditController.getUserActivity.bind(audit_controller_1.auditController));
// Get single audit log
router.get('/:id', (0, validation_middleware_1.validate)(audit_validator_1.getAuditLogSchema), audit_controller_1.auditController.getById.bind(audit_controller_1.auditController));
exports.default = router;
