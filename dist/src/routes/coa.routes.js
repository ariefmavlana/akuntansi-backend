"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coa_controller_1 = require("../controllers/coa.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const coa_validator_1 = require("../validators/coa.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/coa/hierarchy
 * @desc    Get account hierarchy
 * @access  Private
 */
router.get('/hierarchy', (0, validation_middleware_1.validate)(coa_validator_1.getCoaHierarchySchema), coa_controller_1.coaController.getAccountHierarchy.bind(coa_controller_1.coaController));
/**
 * @route   POST /api/v1/coa
 * @desc    Create new account
 * @access  Private (Admin, Accountant)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(coa_validator_1.createCoaSchema), coa_controller_1.coaController.createAccount.bind(coa_controller_1.coaController));
/**
 * @route   GET /api/v1/coa
 * @desc    List accounts with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(coa_validator_1.listCoaSchema), coa_controller_1.coaController.listAccounts.bind(coa_controller_1.coaController));
/**
 * @route   GET /api/v1/coa/:id
 * @desc    Get account by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(coa_validator_1.getCoaByIdSchema), coa_controller_1.coaController.getAccountById.bind(coa_controller_1.coaController));
/**
 * @route   PUT /api/v1/coa/:id
 * @desc    Update account
 * @access  Private (Admin, Accountant)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(coa_validator_1.updateCoaSchema), coa_controller_1.coaController.updateAccount.bind(coa_controller_1.coaController));
/**
 * @route   PUT /api/v1/coa/:id/balance
 * @desc    Update account balance
 * @access  Private (Admin, Accountant)
 */
router.put('/:id/balance', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(coa_validator_1.updateCoaBalanceSchema), coa_controller_1.coaController.updateAccountBalance.bind(coa_controller_1.coaController));
/**
 * @route   DELETE /api/v1/coa/:id
 * @desc    Delete account
 * @access  Private (Admin, Accountant)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(coa_validator_1.deleteCoaSchema), coa_controller_1.coaController.deleteAccount.bind(coa_controller_1.coaController));
exports.default = router;
