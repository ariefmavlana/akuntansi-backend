"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profitCenter_controller_1 = require("../controllers/profitCenter.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const profitCenter_validator_1 = require("../validators/profitCenter.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validation_middleware_1.validate)(profitCenter_validator_1.createProfitCenterSchema), async (req, res) => {
    await profitCenter_controller_1.profitCenterController.create(req, res);
});
router.get('/', (0, validation_middleware_1.validate)(profitCenter_validator_1.getProfitCentersSchema), async (req, res) => {
    await profitCenter_controller_1.profitCenterController.getAll(req, res);
});
router.get('/:id', (0, validation_middleware_1.validate)(profitCenter_validator_1.getProfitCenterByIdSchema), async (req, res) => {
    await profitCenter_controller_1.profitCenterController.getById(req, res);
});
router.put('/:id', (0, validation_middleware_1.validate)(profitCenter_validator_1.updateProfitCenterSchema), async (req, res) => {
    await profitCenter_controller_1.profitCenterController.update(req, res);
});
router.delete('/:id', (0, validation_middleware_1.validate)(profitCenter_validator_1.deleteProfitCenterSchema), async (req, res) => {
    await profitCenter_controller_1.profitCenterController.delete(req, res);
});
router.get('/:id/performance', (0, validation_middleware_1.validate)(profitCenter_validator_1.getProfitCenterPerformanceSchema), async (req, res) => {
    await profitCenter_controller_1.profitCenterController.getPerformance(req, res);
});
exports.default = router;
