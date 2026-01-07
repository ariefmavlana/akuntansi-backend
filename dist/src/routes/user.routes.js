"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_validator_1 = require("../validators/user.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/users
 * @desc    List users with pagination and filters
 * @access  Private (Admin+)
 */
router.get('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(user_validator_1.listUsersSchema), user_controller_1.userController.listUsers.bind(user_controller_1.userController));
/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(user_validator_1.getUserByIdSchema), user_controller_1.userController.getUserById.bind(user_controller_1.userController));
/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Self or Admin)
 */
router.put('/:id', (0, validation_middleware_1.validate)(user_validator_1.updateUserSchema), user_controller_1.userController.updateUser.bind(user_controller_1.userController));
/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin+)
 */
router.put('/:id/role', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(user_validator_1.updateUserRoleSchema), user_controller_1.userController.updateUserRole.bind(user_controller_1.userController));
/**
 * @route   PUT /api/v1/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin+)
 */
router.put('/:id/activate', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(user_validator_1.getUserByIdSchema), user_controller_1.userController.activateUser.bind(user_controller_1.userController));
/**
 * @route   PUT /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin+)
 */
router.put('/:id/deactivate', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(user_validator_1.getUserByIdSchema), user_controller_1.userController.deactivateUser.bind(user_controller_1.userController));
/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(user_validator_1.deleteUserSchema), user_controller_1.userController.deleteUser.bind(user_controller_1.userController));
exports.default = router;
