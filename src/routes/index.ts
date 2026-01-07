import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import companyRoutes from './company.routes';
import coaRoutes from './coa.routes';
import transactionRoutes from './transaction.routes';
import voucherRoutes from './voucher.routes';
import journalRoutes from './journal.routes';
import customerRoutes from './customer.routes';
import supplierRoutes from './supplier.routes';
import paymentRoutes from './payment.routes';
import taxRoutes from './tax.routes';
import inventoryRoutes from './inventory.routes';
import fixedAssetRoutes from './fixedAsset.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/coa', coaRoutes);
router.use('/transactions', transactionRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/journals', journalRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/payments', paymentRoutes);
router.use('/tax', taxRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/fixed-assets', fixedAssetRoutes);

// Health check for API
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
