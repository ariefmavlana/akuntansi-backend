"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const batch_controller_1 = require("../controllers/batch.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const batch_validator_1 = require("../validators/batch.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Batch create transactions
router.post('/transactions', (0, validation_middleware_1.validate)(batch_validator_1.batchTransactionsSchema), batch_controller_1.batchController.batchCreateTransactions.bind(batch_controller_1.batchController));
// Batch process approvals
router.post('/approvals', (0, validation_middleware_1.validate)(batch_validator_1.batchApprovalsSchema), batch_controller_1.batchController.batchProcessApprovals.bind(batch_controller_1.batchController));
// Batch post journals
router.post('/post-journals', (0, validation_middleware_1.validate)(batch_validator_1.batchPostJournalsSchema), batch_controller_1.batchController.batchPostJournals.bind(batch_controller_1.batchController));
// Batch delete
router.delete('/delete', (0, validation_middleware_1.validate)(batch_validator_1.batchDeleteSchema), batch_controller_1.batchController.batchDelete.bind(batch_controller_1.batchController));
exports.default = router;
