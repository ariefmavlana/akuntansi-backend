"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const response_1 = require("../utils/response");
class PaymentController {
    async createPayment(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const payment = await payment_service_1.paymentService.createPayment(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, payment, 'Pembayaran berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    async listPayments(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await payment_service_1.paymentService.listPayments(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data pembayaran berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    async getPaymentById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const payment = await payment_service_1.paymentService.getPaymentById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, payment, 'Data pembayaran berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    async getPaymentSummary(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const summary = await payment_service_1.paymentService.getPaymentSummary(req.query, requestingUserId);
            (0, response_1.successResponse)(res, summary, 'Summary pembayaran berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    async deletePayment(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await payment_service_1.paymentService.deletePayment(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Pembayaran berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
