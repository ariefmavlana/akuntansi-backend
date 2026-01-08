"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const approval_controller_1 = require("../controllers/approval.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const approval_validator_1 = require("../validators/approval.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/templates', (0, validation_middleware_1.validate)(approval_validator_1.createApprovalTemplateSchema), async (req, res) => {
    await approval_controller_1.approvalController.createTemplate(req, res);
});
router.post('/submit', (0, validation_middleware_1.validate)(approval_validator_1.submitForApprovalSchema), async (req, res) => {
    await approval_controller_1.approvalController.submitForApproval(req, res);
});
router.post('/:id/process', (0, validation_middleware_1.validate)(approval_validator_1.processApprovalSchema), async (req, res) => {
    await approval_controller_1.approvalController.processApproval(req, res);
});
router.get('/pending', async (req, res) => {
    await approval_controller_1.approvalController.getPendingApprovals(req, res);
});
router.get('/', (0, validation_middleware_1.validate)(approval_validator_1.getApprovalsSchema), async (req, res) => {
    await approval_controller_1.approvalController.getApprovals(req, res);
});
exports.default = router;
