import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import companyRoutes from './company.routes';
import coaRoutes from './coa.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/coa', coaRoutes);

// Health check for API
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
