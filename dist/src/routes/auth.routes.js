"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', (0, validation_middleware_1.validate)(auth_validator_1.registerSchema), auth_controller_1.authController.register.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', (0, validation_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.authController.login.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', (0, validation_middleware_1.validate)(auth_validator_1.refreshTokenSchema), auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.authController.logout.bind(auth_controller_1.authController));
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.authController.getCurrentUser.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post('/change-password', auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(auth_validator_1.changePasswordSchema), auth_controller_1.authController.changePassword.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', (0, validation_middleware_1.validate)(auth_validator_1.forgotPasswordSchema), auth_controller_1.authController.forgotPassword.bind(auth_controller_1.authController));
/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', (0, validation_middleware_1.validate)(auth_validator_1.resetPasswordSchema), auth_controller_1.authController.resetPassword.bind(auth_controller_1.authController));
exports.default = router;
