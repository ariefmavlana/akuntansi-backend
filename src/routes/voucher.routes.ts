import { Router } from 'express';
import { voucherController } from '@/controllers/voucher.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createVoucherSchema,
    updateVoucherSchema,
    getVoucherByIdSchema,
    listVouchersSchema,
    approveVoucherSchema,
    rejectVoucherSchema,
    postVoucherSchema,
    reverseVoucherSchema,
    deleteVoucherSchema,
} from '@/validators/voucher.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/vouchers
 * @desc    Create new voucher
 * @access  Private (Cashier, Accountant+)
 */
router.post(
    '/',
    authorize(
        Role.SUPERADMIN,
        Role.ADMIN,
        Role.ACCOUNTANT,
        Role.SENIOR_ACCOUNTANT,
        Role.CASHIER
    ),
    validate(createVoucherSchema),
    voucherController.createVoucher.bind(voucherController)
);

/**
 * @route   GET /api/v1/vouchers
 * @desc    List vouchers with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    validate(listVouchersSchema),
    voucherController.listVouchers.bind(voucherController)
);

/**
 * @route   GET /api/v1/vouchers/:id
 * @desc    Get voucher by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getVoucherByIdSchema),
    voucherController.getVoucherById.bind(voucherController)
);

/**
 * @route   PUT /api/v1/vouchers/:id
 * @desc    Update voucher (draft only)
 * @access  Private (Accountant+)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(updateVoucherSchema),
    voucherController.updateVoucher.bind(voucherController)
);

/**
 * @route   POST /api/v1/vouchers/:id/submit
 * @desc    Submit voucher for approval
 * @access  Private (Cashier, Accountant+)
 */
router.post(
    '/:id/submit',
    authorize(
        Role.SUPERADMIN,
        Role.ADMIN,
        Role.ACCOUNTANT,
        Role.SENIOR_ACCOUNTANT,
        Role.CASHIER
    ),
    validate(getVoucherByIdSchema),
    voucherController.submitForApproval.bind(voucherController)
);

/**
 * @route   POST /api/v1/vouchers/:id/approve
 * @desc    Approve voucher
 * @access  Private (Manager+)
 */
router.post(
    '/:id/approve',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.CFO),
    validate(approveVoucherSchema),
    voucherController.approveVoucher.bind(voucherController)
);

/**
 * @route   POST /api/v1/vouchers/:id/reject
 * @desc    Reject voucher
 * @access  Private (Manager+)
 */
router.post(
    '/:id/reject',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.CFO),
    validate(rejectVoucherSchema),
    voucherController.rejectVoucher.bind(voucherController)
);

/**
 * @route   POST /api/v1/vouchers/:id/post
 * @desc    Post voucher to journal
 * @access  Private (Accountant+)
 */
router.post(
    '/:id/post',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(postVoucherSchema),
    voucherController.postVoucher.bind(voucherController)
);

/**
 * @route   POST /api/v1/vouchers/:id/reverse
 * @desc    Reverse voucher
 * @access  Private (Senior Accountant+)
 */
router.post(
    '/:id/reverse',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.SENIOR_ACCOUNTANT),
    validate(reverseVoucherSchema),
    voucherController.reverseVoucher.bind(voucherController)
);

/**
 * @route   DELETE /api/v1/vouchers/:id
 * @desc    Delete voucher (draft/rejected only)
 * @access  Private (Accountant+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(deleteVoucherSchema),
    voucherController.deleteVoucher.bind(voucherController)
);

export default router;
