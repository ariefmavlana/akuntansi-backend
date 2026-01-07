"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tax_controller_1 = require("../controllers/tax.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tax_validator_1 = require("../validators/tax.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/tax/calculate/pph21
 * @desc    Calculate PPh 21 (Employee Income Tax)
 * @access  Private
 */
router.post('/calculate/pph21', (0, validation_middleware_1.validate)(tax_validator_1.calculatePPh21Schema), tax_controller_1.taxController.calculatePPh21.bind(tax_controller_1.taxController));
/**
 * @route   POST /api/v1/tax/calculate/ppn
 * @desc    Calculate PPN (VAT)
 * @access  Private
 */
router.post('/calculate/ppn', (0, validation_middleware_1.validate)(tax_validator_1.calculatePPNSchema), tax_controller_1.taxController.calculatePPN.bind(tax_controller_1.taxController));
/**
 * @route   GET /api/v1/tax/report
 * @desc    Get tax report
 * @access  Private
 */
router.get('/report', (0, validation_middleware_1.validate)(tax_validator_1.getTaxReportSchema), tax_controller_1.taxController.getTaxReport.bind(tax_controller_1.taxController));
exports.default = router;
