import { Request, Response, NextFunction } from 'express';
import { paymentService } from '@/services/payment.service';
import { successResponse, createdResponse } from '@/utils/response';

export class PaymentController {
    async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const payment = await paymentService.createPayment(req.body, requestingUserId);
            createdResponse(res, payment, 'Pembayaran berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await paymentService.listPayments(req.query as any, requestingUserId);
            successResponse(res, result.data, 'Data pembayaran berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const payment = await paymentService.getPaymentById(req.params.id, requestingUserId);
            successResponse(res, payment, 'Data pembayaran berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    async getPaymentSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const summary = await paymentService.getPaymentSummary(req.query as any, requestingUserId);
            successResponse(res, summary, 'Summary pembayaran berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    async deletePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await paymentService.deletePayment(req.params.id, requestingUserId);
            successResponse(res, null, 'Pembayaran berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

export const paymentController = new PaymentController();
