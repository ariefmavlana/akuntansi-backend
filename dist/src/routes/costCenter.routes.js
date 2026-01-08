"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const costCenter_controller_1 = require("../controllers/costCenter.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const costCenter_validator_1 = require("../validators/costCenter.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validation_middleware_1.validate)(costCenter_validator_1.createCostCenterSchema), async (req, res) => {
    await costCenter_controller_1.costCenterController.create(req, res);
});
router.get('/', (0, validation_middleware_1.validate)(costCenter_validator_1.getCostCentersSchema), async (req, res) => {
    await costCenter_controller_1.costCenterController.getAll(req, res);
});
router.get('/:id', (0, validation_middleware_1.validate)(costCenter_validator_1.getCostCenterByIdSchema), async (req, res) => {
    await costCenter_controller_1.costCenterController.getById(req, res);
});
router.put('/:id', (0, validation_middleware_1.validate)(costCenter_validator_1.updateCostCenterSchema), async (req, res) => {
    await costCenter_controller_1.costCenterController.update(req, res);
});
router.delete('/:id', (0, validation_middleware_1.validate)(costCenter_validator_1.deleteCostCenterSchema), async (req, res) => {
    await costCenter_controller_1.costCenterController.delete(req, res);
});
router.get('/:id/transactions', (0, validation_middleware_1.validate)(costCenter_validator_1.getCostCenterTransactionsSchema), async (req, res) => {
    await costCenter_controller_1.costCenterController.getTransactions(req, res);
});
exports.default = router;
