"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractController = exports.ContractController = void 0;
const contract_service_1 = require("../services/contract.service");
const response_1 = require("../utils/response");
/**
 * Contract Controller
 * Handles HTTP requests for contract management endpoints
 */
class ContractController {
    /**
     * Create new contract
     * POST /api/v1/contracts
     */
    async createContract(req, res, next) {
        try {
            const contract = await contract_service_1.contractService.createContract(req.body);
            (0, response_1.createdResponse)(res, contract, 'Kontrak berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List contracts with pagination and filters
     * GET /api/v1/contracts
     */
    async listContracts(req, res, next) {
        try {
            const result = await contract_service_1.contractService.listContracts(req.query);
            (0, response_1.successResponse)(res, result.data, 'Data kontrak berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get contract by ID
     * GET /api/v1/contracts/:id
     */
    async getContractById(req, res, next) {
        try {
            const contract = await contract_service_1.contractService.getContractById(req.params.id);
            if (!contract) {
                // Not found is usually handled by service throwing or we can throw here
                // Service returns null, so handled here
                res.status(404).json({ success: false, message: 'Kontrak tidak ditemukan' });
                return;
            }
            (0, response_1.successResponse)(res, contract, 'Data kontrak berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update contract
     * PUT /api/v1/contracts/:id
     */
    async updateContract(req, res, next) {
        try {
            const contract = await contract_service_1.contractService.updateContract(req.params.id, req.body);
            (0, response_1.successResponse)(res, contract, 'Kontrak berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete contract
     * DELETE /api/v1/contracts/:id
     */
    async deleteContract(req, res, next) {
        try {
            await contract_service_1.contractService.deleteContract(req.params.id);
            (0, response_1.successResponse)(res, null, 'Kontrak berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ContractController = ContractController;
// Export singleton instance
exports.contractController = new ContractController();
