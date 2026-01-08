"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contract_controller_1 = require("../controllers/contract.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const contract_validator_1 = require("../validators/contract.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/contracts
 * @desc    Create new contract
 * @access  Private (Admin+)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(contract_validator_1.createContractSchema), contract_controller_1.contractController.createContract.bind(contract_controller_1.contractController));
/**
 * @route   GET /api/v1/contracts
 * @desc    List contracts
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(contract_validator_1.listContractsSchema), contract_controller_1.contractController.listContracts.bind(contract_controller_1.contractController));
/**
 * @route   GET /api/v1/contracts/:id
 * @desc    Get contract by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(contract_validator_1.getContractByIdSchema), contract_controller_1.contractController.getContractById.bind(contract_controller_1.contractController));
/**
 * @route   PUT /api/v1/contracts/:id
 * @desc    Update contract
 * @access  Private (Admin+)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(contract_validator_1.updateContractSchema), contract_controller_1.contractController.updateContract.bind(contract_controller_1.contractController));
/**
 * @route   DELETE /api/v1/contracts/:id
 * @desc    Delete contract
 * @access  Private (Admin+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(contract_validator_1.deleteContractSchema), contract_controller_1.contractController.deleteContract.bind(contract_controller_1.contractController));
exports.default = router;
