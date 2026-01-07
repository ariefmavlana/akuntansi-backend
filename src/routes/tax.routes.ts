import { Router } from 'express';
import { taxController } from '@/controllers/tax.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    calculatePPh21Schema,
    calculatePPNSchema,
    getTaxReportSchema,
} from '@/validators/tax.validator';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

/**
 * @route   POST /api/v1/tax/calculate/pph21
 * @desc    Calculate PPh 21 (Employee Income Tax)
 * @access  Private
 */
router.post(
    '/calculate/pph21',
    validate(calculatePPh21Schema),
    taxController.calculatePPh21.bind(taxController)
);

/**
 * @route   POST /api/v1/tax/calculate/ppn
 * @desc    Calculate PPN (VAT)
 * @access  Private
 */
router.post(
    '/calculate/ppn',
    validate(calculatePPNSchema),
    taxController.calculatePPN.bind(taxController)
);

/**
 * @route   GET /api/v1/tax/report
 * @desc    Get tax report
 * @access  Private
 */
router.get(
    '/report',
    validate(getTaxReportSchema),
    taxController.getTaxReport.bind(taxController)
);

export default router;
