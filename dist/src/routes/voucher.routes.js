"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voucher_controller_1 = require("../controllers/voucher.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const voucher_validator_1 = require("../validators/voucher.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/vouchers
 * @desc    Create new voucher
 * @access  Private (Cashier, Accountant+)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT, client_1.Role.CASHIER), (0, validation_middleware_1.validate)(voucher_validator_1.createVoucherSchema), voucher_controller_1.voucherController.createVoucher.bind(voucher_controller_1.voucherController));
/**
 * @route   GET /api/v1/vouchers
 * @desc    List vouchers with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(voucher_validator_1.listVouchersSchema), voucher_controller_1.voucherController.listVouchers.bind(voucher_controller_1.voucherController));
/**
 * @route   GET /api/v1/vouchers/:id
 * @desc    Get voucher by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(voucher_validator_1.getVoucherByIdSchema), voucher_controller_1.voucherController.getVoucherById.bind(voucher_controller_1.voucherController));
/**
 * @route   PUT /api/v1/vouchers/:id
 * @desc    Update voucher (draft only)
 * @access  Private (Accountant+)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(voucher_validator_1.updateVoucherSchema), voucher_controller_1.voucherController.updateVoucher.bind(voucher_controller_1.voucherController));
/**
 * @route   POST /api/v1/vouchers/:id/submit
 * @desc    Submit voucher for approval
 * @access  Private (Cashier, Accountant+)
 */
router.post('/:id/submit', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT, client_1.Role.CASHIER), (0, validation_middleware_1.validate)(voucher_validator_1.getVoucherByIdSchema), voucher_controller_1.voucherController.submitForApproval.bind(voucher_controller_1.voucherController));
/**
 * @route   POST /api/v1/vouchers/:id/approve
 * @desc    Approve voucher
 * @access  Private (Manager+)
 */
router.post('/:id/approve', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.CFO), (0, validation_middleware_1.validate)(voucher_validator_1.approveVoucherSchema), voucher_controller_1.voucherController.approveVoucher.bind(voucher_controller_1.voucherController));
/**
 * @route   POST /api/v1/vouchers/:id/reject
 * @desc    Reject voucher
 * @access  Private (Manager+)
 */
router.post('/:id/reject', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.CFO), (0, validation_middleware_1.validate)(voucher_validator_1.rejectVoucherSchema), voucher_controller_1.voucherController.rejectVoucher.bind(voucher_controller_1.voucherController));
/**
 * @route   POST /api/v1/vouchers/:id/post
 * @desc    Post voucher to journal
 * @access  Private (Accountant+)
 */
router.post('/:id/post', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(voucher_validator_1.postVoucherSchema), voucher_controller_1.voucherController.postVoucher.bind(voucher_controller_1.voucherController));
/**
 * @route   POST /api/v1/vouchers/:id/reverse
 * @desc    Reverse voucher
 * @access  Private (Senior Accountant+)
 */
router.post('/:id/reverse', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(voucher_validator_1.reverseVoucherSchema), voucher_controller_1.voucherController.reverseVoucher.bind(voucher_controller_1.voucherController));
/**
 * @route   DELETE /api/v1/vouchers/:id
 * @desc    Delete voucher (draft/rejected only)
 * @access  Private (Accountant+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(voucher_validator_1.deleteVoucherSchema), voucher_controller_1.voucherController.deleteVoucher.bind(voucher_controller_1.voucherController));
exports.default = router;
