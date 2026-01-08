"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budget_controller_1 = require("../controllers/budget.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const budget_validator_1 = require("../validators/budget.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Budget CRUD
router.post('/', (0, validation_middleware_1.validate)(budget_validator_1.createBudgetSchema), async (req, res) => {
    await budget_controller_1.budgetController.create(req, res);
});
router.get('/', (0, validation_middleware_1.validate)(budget_validator_1.getBudgetsSchema), async (req, res) => {
    await budget_controller_1.budgetController.getAll(req, res);
});
router.get('/:id', async (req, res) => {
    await budget_controller_1.budgetController.getById(req, res);
});
router.put('/:id', (0, validation_middleware_1.validate)(budget_validator_1.updateBudgetSchema), async (req, res) => {
    await budget_controller_1.budgetController.update(req, res);
});
router.delete('/:id', async (req, res) => {
    await budget_controller_1.budgetController.delete(req, res);
});
// Approval workflow
router.post('/:id/approve', (0, validation_middleware_1.validate)(budget_validator_1.approveBudgetSchema), async (req, res) => {
    await budget_controller_1.budgetController.approve(req, res);
});
router.post('/:id/activate', (0, validation_middleware_1.validate)(budget_validator_1.activateBudgetSchema), async (req, res) => {
    await budget_controller_1.budgetController.activate(req, res);
});
router.post('/:id/close', (0, validation_middleware_1.validate)(budget_validator_1.closeBudgetSchema), async (req, res) => {
    await budget_controller_1.budgetController.close(req, res);
});
// Budget details
router.post('/:id/details', (0, validation_middleware_1.validate)(budget_validator_1.addBudgetDetailSchema), async (req, res) => {
    await budget_controller_1.budgetController.addDetail(req, res);
});
router.put('/:id/details/:detailId', (0, validation_middleware_1.validate)(budget_validator_1.updateBudgetDetailSchema), async (req, res) => {
    await budget_controller_1.budgetController.updateDetail(req, res);
});
router.delete('/:id/details/:detailId', (0, validation_middleware_1.validate)(budget_validator_1.deleteBudgetDetailSchema), async (req, res) => {
    await budget_controller_1.budgetController.deleteDetail(req, res);
});
// Revisions
router.post('/:id/revisions', (0, validation_middleware_1.validate)(budget_validator_1.createBudgetRevisionSchema), async (req, res) => {
    await budget_controller_1.budgetController.createRevision(req, res);
});
// Analysis
router.get('/:id/vs-actual', (0, validation_middleware_1.validate)(budget_validator_1.getBudgetVsActualSchema), async (req, res) => {
    await budget_controller_1.budgetController.getBudgetVsActual(req, res);
});
exports.default = router;
