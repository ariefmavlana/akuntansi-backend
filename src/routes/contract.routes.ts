import { Router } from 'express';
import { contractController } from '@/controllers/contract.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createContractSchema,
    updateContractSchema,
    getContractByIdSchema,
    listContractsSchema,
    deleteContractSchema,
} from '@/validators/contract.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/contracts
 * @desc    Create new contract
 * @access  Private (Admin+)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(createContractSchema),
    contractController.createContract.bind(contractController)
);

/**
 * @route   GET /api/v1/contracts
 * @desc    List contracts
 * @access  Private
 */
router.get(
    '/',
    validate(listContractsSchema),
    contractController.listContracts.bind(contractController)
);

/**
 * @route   GET /api/v1/contracts/:id
 * @desc    Get contract by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getContractByIdSchema),
    contractController.getContractById.bind(contractController)
);

/**
 * @route   PUT /api/v1/contracts/:id
 * @desc    Update contract
 * @access  Private (Admin+)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(updateContractSchema),
    contractController.updateContract.bind(contractController)
);

/**
 * @route   DELETE /api/v1/contracts/:id
 * @desc    Delete contract
 * @access  Private (Admin+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(deleteContractSchema),
    contractController.deleteContract.bind(contractController)
);

export default router;
