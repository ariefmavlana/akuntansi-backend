"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixedAssetService = exports.FixedAssetService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Fixed Asset Service
 * Handles fixed assets and depreciation using Prisma
 */
class FixedAssetService {
    async generateAssetCode(perusahaanId) {
        const count = await database_1.default.asetTetap.count({ where: { perusahaanId } });
        return `FA-${String(count + 1).padStart(4, '0')}`;
    }
    async createFixedAsset(data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat aset tetap');
            }
            const kodeAset = data.kodeAset || (await this.generateAssetCode(data.perusahaanId));
            const asset = await database_1.default.asetTetap.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kodeAset,
                    namaAset: data.namaAset,
                    kategori: data.kategori,
                    tanggalPerolehan: typeof data.tanggalPerolehan === 'string' ? new Date(data.tanggalPerolehan) : data.tanggalPerolehan,
                    nilaiPerolehan: data.nilaiPerolehan,
                    nilaiResidu: data.nilaiResidu,
                    umurEkonomis: data.masaManfaat,
                    metodePenyusutan: data.metodePenyusutan,
                    nilaiBuku: data.nilaiPerolehan,
                    lokasi: data.lokasiId,
                    supplierId: data.pemasokId,
                    catatan: data.keterangan,
                },
            });
            logger_1.default.info(`Fixed asset created: ${kodeAset} by ${requestingUser.email}`);
            return asset;
        }
        catch (error) {
            logger_1.default.error('Create fixed asset error:', error);
            throw error;
        }
    }
    async calculateDepreciation(assetId, tanggalHitung) {
        try {
            const asset = await database_1.default.asetTetap.findUnique({ where: { id: assetId } });
            if (!asset)
                throw new auth_service_1.ValidationError('Aset tidak ditemukan');
            const tanggal = tanggalHitung || new Date();
            const tanggalPerolehan = new Date(asset.tanggalPerolehan);
            const monthsDiff = (tanggal.getFullYear() - tanggalPerolehan.getFullYear()) * 12 + (tanggal.getMonth() - tanggalPerolehan.getMonth());
            let penyusutanBulanIni = 0;
            if (asset.metodePenyusutan === 'GARIS_LURUS') {
                const nilaiTersusutkan = asset.nilaiPerolehan.toNumber() - asset.nilaiResidu.toNumber();
                const penyusutanPerBulan = nilaiTersusutkan / (asset.umurEkonomis * 12);
                penyusutanBulanIni = penyusutanPerBulan;
                const totalPenyusutan = Math.min(penyusutanPerBulan * monthsDiff, nilaiTersusutkan);
                await database_1.default.asetTetap.update({
                    where: { id: assetId },
                    data: {
                        akumulasiPenyusutan: totalPenyusutan,
                        nilaiBuku: asset.nilaiPerolehan.toNumber() - totalPenyusutan,
                    },
                });
            }
            const updatedAsset = await database_1.default.asetTetap.findUnique({ where: { id: assetId } });
            logger_1.default.info(`Depreciation calculated for: ${asset.kodeAset}`);
            return {
                asset: updatedAsset,
                depreciation: {
                    jumlahPenyusutan: penyusutanBulanIni,
                    akumulasiPenyusutan: updatedAsset.akumulasiPenyusutan.toNumber(),
                    nilaiBuku: updatedAsset.nilaiBuku.toNumber(),
                },
                monthsDepreciated: monthsDiff,
            };
        }
        catch (error) {
            logger_1.default.error('Calculate depreciation error:', error);
            throw error;
        }
    }
    async disposeAsset(assetId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const asset = await database_1.default.asetTetap.findUnique({ where: { id: assetId } });
            if (!asset)
                throw new auth_service_1.ValidationError('Aset tidak ditemukan');
            if (asset.status !== 'AKTIF')
                throw new auth_service_1.ValidationError('Aset sudah tidak aktif');
            const gainLoss = data.nilaiPelepasan - asset.nilaiBuku.toNumber();
            const updatedAsset = await database_1.default.asetTetap.update({
                where: { id: assetId },
                data: {
                    status: 'TIDAK_AKTIF',
                    tanggalPenjualan: typeof data.tanggalPelepasan === 'string' ? new Date(data.tanggalPelepasan) : data.tanggalPelepasan,
                    nilaiPenjualan: data.nilaiPelepasan,
                    catatan: `${asset.catatan || ''}\nPelepasan: ${data.alasan}`,
                },
            });
            logger_1.default.info(`Asset disposed: ${asset.kodeAset} by ${requestingUser.email}`);
            return {
                asset: updatedAsset,
                gainLoss,
                message: gainLoss >= 0 ? 'Keuntungan pelepasan aset' : 'Kerugian pelepasan aset',
            };
        }
        catch (error) {
            logger_1.default.error('Dispose asset error:', error);
            throw error;
        }
    }
    async listFixedAssets(filters, requestingUserId) {
        try {
            const { page = 1, limit = 20, perusahaanId, kategori, status } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const where = {};
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (kategori)
                where.kategori = kategori;
            if (status)
                where.status = status;
            const total = await database_1.default.asetTetap.count({ where });
            const items = await database_1.default.asetTetap.findMany({
                where,
                select: {
                    id: true,
                    kodeAset: true,
                    namaAset: true,
                    kategori: true,
                    tanggalPerolehan: true,
                    nilaiPerolehan: true,
                    akumulasiPenyusutan: true,
                    nilaiBuku: true,
                    status: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { namaAset: 'asc' },
            });
            return {
                data: items,
                meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        }
        catch (error) {
            logger_1.default.error('List fixed assets error:', error);
            throw error;
        }
    }
    async getFixedAssetById(id, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const asset = await database_1.default.asetTetap.findUnique({
                where: { id },
                include: { supplier: { select: { nama: true, kodePemasok: true } } },
            });
            if (!asset)
                throw new auth_service_1.ValidationError('Aset tidak ditemukan');
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== asset.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke aset ini');
            }
            return asset;
        }
        catch (error) {
            logger_1.default.error('Get fixed asset by ID error:', error);
            throw error;
        }
    }
}
exports.FixedAssetService = FixedAssetService;
exports.fixedAssetService = new FixedAssetService();
