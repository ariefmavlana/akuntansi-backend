import { Router } from 'express';
import { userController } from '@/controllers/user.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    listUsersSchema,
    getUserByIdSchema,
    updateUserSchema,
    updateUserRoleSchema,
    deleteUserSchema,
} from '@/validators/user.validator';
import { Role } from '@prisma/client';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    List users with pagination and filters
 * @access  Private (Admin+)
 */
router.get(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(listUsersSchema),
    userController.listUsers.bind(userController)
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getUserByIdSchema),
    userController.getUserById.bind(userController)
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Self or Admin)
 */
router.put(
    '/:id',
    validate(updateUserSchema),
    userController.updateUser.bind(userController)
);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin+)
 */
router.put(
    '/:id/role',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(updateUserRoleSchema),
    userController.updateUserRole.bind(userController)
);

/**
 * @route   PUT /api/v1/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin+)
 */
router.put(
    '/:id/activate',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(getUserByIdSchema),
    userController.activateUser.bind(userController)
);

/**
 * @route   PUT /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin+)
 */
router.put(
    '/:id/deactivate',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(getUserByIdSchema),
    userController.deactivateUser.bind(userController)
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(deleteUserSchema),
    userController.deleteUser.bind(userController)
);

export default router;
