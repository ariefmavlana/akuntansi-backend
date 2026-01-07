import { Router } from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    createPaymentSchema,
    getPaymentByIdSchema,
    listPaymentsSchema,
    getPaymentSummarySchema,
    deletePaymentSchema,
} from '@/validators/payment.validator';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.CASHIER, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(createPaymentSchema),
    paymentController.createPayment.bind(paymentController)
);

router.get(
    '/summary',
    validate(getPaymentSummarySchema),
    paymentController.getPaymentSummary.bind(paymentController)
);

router.get(
    '/',
    validate(listPaymentsSchema),
    paymentController.listPayments.bind(paymentController)
);

router.get(
    '/:id',
    validate(getPaymentByIdSchema),
    paymentController.getPaymentById.bind(paymentController)
);

router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.SENIOR_ACCOUNTANT),
    validate(deletePaymentSchema),
    paymentController.deletePayment.bind(paymentController)
);

export default router;
