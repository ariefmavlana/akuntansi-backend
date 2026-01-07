"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxController = exports.TaxController = void 0;
const tax_service_1 = require("../services/tax.service");
const response_1 = require("../utils/response");
class TaxController {
    async calculatePPh21(req, res, next) {
        try {
            const result = await tax_service_1.taxService.calculatePPh21(req.body);
            (0, response_1.successResponse)(res, result, 'Perhitungan PPh 21 berhasil');
        }
        catch (error) {
            next(error);
        }
    }
    async calculatePPN(req, res, next) {
        try {
            const result = await tax_service_1.taxService.calculatePPN(req.body);
            (0, response_1.successResponse)(res, result, 'Perhitungan PPN berhasil');
        }
        catch (error) {
            next(error);
        }
    }
    async getTaxReport(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const report = await tax_service_1.taxService.getTaxReport(req.query, requestingUserId);
            (0, response_1.successResponse)(res, report, 'Laporan pajak berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TaxController = TaxController;
exports.taxController = new TaxController();
