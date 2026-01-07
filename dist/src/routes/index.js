"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const company_routes_1 = __importDefault(require("./company.routes"));
const coa_routes_1 = __importDefault(require("./coa.routes"));
const transaction_routes_1 = __importDefault(require("./transaction.routes"));
const voucher_routes_1 = __importDefault(require("./voucher.routes"));
const journal_routes_1 = __importDefault(require("./journal.routes"));
const customer_routes_1 = __importDefault(require("./customer.routes"));
const supplier_routes_1 = __importDefault(require("./supplier.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const tax_routes_1 = __importDefault(require("./tax.routes"));
const inventory_routes_1 = __importDefault(require("./inventory.routes"));
const fixedAsset_routes_1 = __importDefault(require("./fixedAsset.routes"));
const router = (0, express_1.Router)();
// Mount routes
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/companies', company_routes_1.default);
router.use('/coa', coa_routes_1.default);
router.use('/transactions', transaction_routes_1.default);
router.use('/vouchers', voucher_routes_1.default);
router.use('/journals', journal_routes_1.default);
router.use('/customers', customer_routes_1.default);
router.use('/suppliers', supplier_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/tax', tax_routes_1.default);
router.use('/inventory', inventory_routes_1.default);
router.use('/fixed-assets', fixedAsset_routes_1.default);
// Health check for API
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
