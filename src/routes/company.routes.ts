import { Router } from 'express';
import { companyController } from '@/controllers/company.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    createCompanySchema,
    updateCompanySchema,
    getCompanyByIdSchema,
    listCompaniesSchema,
    deleteCompanySchema,
    createBranchSchema,
    updateBranchSchema,
    getBranchByIdSchema,
    listBranchesSchema,
    deleteBranchSchema,
} from '@/validators/company.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// COMPANY ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/companies
 * @desc    Create new company
 * @access  Private (SUPERADMIN only)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN),
    validate(createCompanySchema),
    companyController.createCompany.bind(companyController)
);

/**
 * @route   GET /api/v1/companies
 * @desc    List companies with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    validate(listCompaniesSchema),
    companyController.listCompanies.bind(companyController)
);

/**
 * @route   GET /api/v1/companies/:id
 * @desc    Get company by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getCompanyByIdSchema),
    companyController.getCompanyById.bind(companyController)
);

/**
 * @route   PUT /api/v1/companies/:id
 * @desc    Update company
 * @access  Private (SUPERADMIN or own company ADMIN)
 */
router.put(
    '/:id',
    validate(updateCompanySchema),
    companyController.updateCompany.bind(companyController)
);

/**
 * @route   DELETE /api/v1/companies/:id
 * @desc    Delete company
 * @access  Private (SUPERADMIN only)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN),
    validate(deleteCompanySchema),
    companyController.deleteCompany.bind(companyController)
);

// ============================================================================
// BRANCH ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/companies/branches
 * @desc    Create new branch
 * @access  Private (SUPERADMIN, ADMIN, MANAGER)
 */
router.post(
    '/branches',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(createBranchSchema),
    companyController.createBranch.bind(companyController)
);

/**
 * @route   GET /api/v1/companies/branches
 * @desc    List branches with pagination and filters
 * @access  Private
 */
router.get(
    '/branches',
    validate(listBranchesSchema),
    companyController.listBranches.bind(companyController)
);

/**
 * @route   GET /api/v1/companies/branches/:id
 * @desc    Get branch by ID
 * @access  Private
 */
router.get(
    '/branches/:id',
    validate(getBranchByIdSchema),
    companyController.getBranchById.bind(companyController)
);

/**
 * @route   PUT /api/v1/companies/branches/:id
 * @desc    Update branch
 * @access  Private (SUPERADMIN, ADMIN, MANAGER)
 */
router.put(
    '/branches/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(updateBranchSchema),
    companyController.updateBranch.bind(companyController)
);

/**
 * @route   DELETE /api/v1/companies/branches/:id
 * @desc    Delete branch
 * @access  Private (SUPERADMIN, ADMIN)
 */
router.delete(
    '/branches/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(deleteBranchSchema),
    companyController.deleteBranch.bind(companyController)
);

export default router;
