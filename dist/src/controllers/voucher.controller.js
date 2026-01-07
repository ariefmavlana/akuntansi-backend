"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voucherController = exports.VoucherController = void 0;
const voucher_service_1 = require("../services/voucher.service");
const response_1 = require("../utils/response");
/**
 * Voucher Controller
 * Handles HTTP requests for voucher management endpoints
 */
class VoucherController {
    /**
     * Create new voucher
     * POST /api/v1/vouchers
     */
    async createVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.createVoucher(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, voucher, 'Voucher berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List vouchers with pagination and filters
     * GET /api/v1/vouchers
     */
    async listVouchers(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await voucher_service_1.voucherService.listVouchers(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data voucher berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get voucher by ID
     * GET /api/v1/vouchers/:id
     */
    async getVoucherById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.getVoucherById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Data voucher berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update voucher
     * PUT /api/v1/vouchers/:id
     */
    async updateVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.updateVoucher(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Voucher berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Submit voucher for approval
     * POST /api/v1/vouchers/:id/submit
     */
    async submitForApproval(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.submitForApproval(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Voucher berhasil disubmit untuk approval');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Approve voucher
     * POST /api/v1/vouchers/:id/approve
     */
    async approveVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.approveVoucher(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Voucher berhasil disetujui');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reject voucher
     * POST /api/v1/vouchers/:id/reject
     */
    async rejectVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.rejectVoucher(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Voucher berhasil ditolak');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Post voucher to journal
     * POST /api/v1/vouchers/:id/post
     */
    async postVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.postVoucher(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Voucher berhasil diposting');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reverse voucher
     * POST /api/v1/vouchers/:id/reverse
     */
    async reverseVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const voucher = await voucher_service_1.voucherService.reverseVoucher(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, voucher, 'Voucher berhasil direverse');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete voucher
     * DELETE /api/v1/vouchers/:id
     */
    async deleteVoucher(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await voucher_service_1.voucherService.deleteVoucher(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Voucher berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VoucherController = VoucherController;
// Export singleton instance
exports.voucherController = new VoucherController();
