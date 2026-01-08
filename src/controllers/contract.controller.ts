import { Request, Response, NextFunction } from 'express';
import { contractService } from '@/services/contract.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Contract Controller
 * Handles HTTP requests for contract management endpoints
 */
export class ContractController {
    /**
     * Create new contract
     * POST /api/v1/contracts
     */
    async createContract(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const contract = await contractService.createContract(req.body);
            createdResponse(res, contract, 'Kontrak berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List contracts with pagination and filters
     * GET /api/v1/contracts
     */
    async listContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await contractService.listContracts(req.query as any);
            successResponse(res, result.data, 'Data kontrak berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get contract by ID
     * GET /api/v1/contracts/:id
     */
    async getContractById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const contract = await contractService.getContractById(req.params.id);
            if (!contract) {
                // Not found is usually handled by service throwing or we can throw here
                // Service returns null, so handled here
                res.status(404).json({ success: false, message: 'Kontrak tidak ditemukan' });
                return;
            }
            successResponse(res, contract, 'Data kontrak berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update contract
     * PUT /api/v1/contracts/:id
     */
    async updateContract(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const contract = await contractService.updateContract(req.params.id, req.body);
            successResponse(res, contract, 'Kontrak berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete contract
     * DELETE /api/v1/contracts/:id
     */
    async deleteContract(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await contractService.deleteContract(req.params.id);
            successResponse(res, null, 'Kontrak berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const contractController = new ContractController();
