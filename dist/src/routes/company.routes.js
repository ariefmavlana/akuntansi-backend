"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const company_validator_1 = require("../validators/company.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ============================================================================
// COMPANY ROUTES
// ============================================================================
/**
 * @route   POST /api/v1/companies
 * @desc    Create new company
 * @access  Private (SUPERADMIN only)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN), (0, validation_middleware_1.validate)(company_validator_1.createCompanySchema), company_controller_1.companyController.createCompany.bind(company_controller_1.companyController));
/**
 * @route   GET /api/v1/companies
 * @desc    List companies with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(company_validator_1.listCompaniesSchema), company_controller_1.companyController.listCompanies.bind(company_controller_1.companyController));
/**
 * @route   GET /api/v1/companies/:id
 * @desc    Get company by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(company_validator_1.getCompanyByIdSchema), company_controller_1.companyController.getCompanyById.bind(company_controller_1.companyController));
/**
 * @route   PUT /api/v1/companies/:id
 * @desc    Update company
 * @access  Private (SUPERADMIN or own company ADMIN)
 */
router.put('/:id', (0, validation_middleware_1.validate)(company_validator_1.updateCompanySchema), company_controller_1.companyController.updateCompany.bind(company_controller_1.companyController));
/**
 * @route   DELETE /api/v1/companies/:id
 * @desc    Delete company
 * @access  Private (SUPERADMIN only)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN), (0, validation_middleware_1.validate)(company_validator_1.deleteCompanySchema), company_controller_1.companyController.deleteCompany.bind(company_controller_1.companyController));
// ============================================================================
// BRANCH ROUTES
// ============================================================================
/**
 * @route   POST /api/v1/companies/branches
 * @desc    Create new branch
 * @access  Private (SUPERADMIN, ADMIN, MANAGER)
 */
router.post('/branches', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(company_validator_1.createBranchSchema), company_controller_1.companyController.createBranch.bind(company_controller_1.companyController));
/**
 * @route   GET /api/v1/companies/branches
 * @desc    List branches with pagination and filters
 * @access  Private
 */
router.get('/branches', (0, validation_middleware_1.validate)(company_validator_1.listBranchesSchema), company_controller_1.companyController.listBranches.bind(company_controller_1.companyController));
/**
 * @route   GET /api/v1/companies/branches/:id
 * @desc    Get branch by ID
 * @access  Private
 */
router.get('/branches/:id', (0, validation_middleware_1.validate)(company_validator_1.getBranchByIdSchema), company_controller_1.companyController.getBranchById.bind(company_controller_1.companyController));
/**
 * @route   PUT /api/v1/companies/branches/:id
 * @desc    Update branch
 * @access  Private (SUPERADMIN, ADMIN, MANAGER)
 */
router.put('/branches/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(company_validator_1.updateBranchSchema), company_controller_1.companyController.updateBranch.bind(company_controller_1.companyController));
/**
 * @route   DELETE /api/v1/companies/branches/:id
 * @desc    Delete branch
 * @access  Private (SUPERADMIN, ADMIN)
 */
router.delete('/branches/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(company_validator_1.deleteBranchSchema), company_controller_1.companyController.deleteBranch.bind(company_controller_1.companyController));
exports.default = router;
