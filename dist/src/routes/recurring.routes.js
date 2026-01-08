"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recurring_controller_1 = require("../controllers/recurring.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const recurring_validator_1 = require("../validators/recurring.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Create recurring transaction
router.post('/', (0, validation_middleware_1.validate)(recurring_validator_1.createRecurringTransactionSchema), recurring_controller_1.recurringController.create.bind(recurring_controller_1.recurringController));
// Get all recurring transactions
router.get('/', (0, validation_middleware_1.validate)(recurring_validator_1.getRecurringTransactionsSchema), recurring_controller_1.recurringController.getAll.bind(recurring_controller_1.recurringController));
// Get single recurring transaction
router.get('/:id', recurring_controller_1.recurringController.getById.bind(recurring_controller_1.recurringController));
// Update recurring transaction
router.put('/:id', (0, validation_middleware_1.validate)(recurring_validator_1.updateRecurringTransactionSchema), recurring_controller_1.recurringController.update.bind(recurring_controller_1.recurringController));
// Execute recurring transaction now
router.post('/:id/execute', (0, validation_middleware_1.validate)(recurring_validator_1.executeRecurringTransactionSchema), recurring_controller_1.recurringController.execute.bind(recurring_controller_1.recurringController));
// Get recurring transaction history
router.get('/:id/history', (0, validation_middleware_1.validate)(recurring_validator_1.getRecurringHistorySchema), recurring_controller_1.recurringController.getHistory.bind(recurring_controller_1.recurringController));
// Delete recurring transaction
router.delete('/:id', recurring_controller_1.recurringController.delete.bind(recurring_controller_1.recurringController));
// Process due recurring transactions (for cron)
router.post('/cron/process', recurring_controller_1.recurringController.processDue.bind(recurring_controller_1.recurringController));
exports.default = router;
