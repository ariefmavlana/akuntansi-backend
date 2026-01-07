import prisma from '@/config/database';
import logger from '@/utils/logger';
import { AsetTetap, Prisma } from '@prisma/client';
import type {
    CreateFixedAssetInput,
    CalculateDepreciationInput,
    DisposeAssetInput,
    ListFixedAssetsInput,
} from '@/validators/fixedAsset.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Fixed Asset Service
 * Handles fixed assets and depreciation using Prisma
 */
export class FixedAssetService {
    private async generateAssetCode(perusahaanId: string): Promise<string> {
        const count = await prisma.asetTetap.count({ where: { perusahaanId } });
        return `FA-${String(count + 1).padStart(4, '0')}`;
    }

    async createFixedAsset(data: CreateFixedAssetInput, requestingUserId: string): Promise<AsetTetap> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat aset tetap');
            }

            const kodeAset = data.kodeAset || (await this.generateAssetCode(data.perusahaanId));

            const asset = await prisma.asetTetap.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kodeAset,
                    namaAset: data.namaAset,
                    kategori: data.kategori,
                    tanggalPerolehan: typeof data.tanggalPerolehan === 'string' ? new Date(data.tanggalPerolehan) : data.tanggalPerolehan,
                    nilaiPerolehan: data.nilaiPerolehan,
                    nilaiResidu: data.nilaiResidu,
                    umurEkonomis: data.masaManfaat,
                    metodePenyusutan: data.metodePenyusutan as any,
                    nilaiBuku: data.nilaiPerolehan,
                    lokasi: data.lokasiId,
                    supplierId: data.pemasokId,
                    catatan: data.keterangan,
                },
            });

            logger.info(`Fixed asset created: ${kodeAset} by ${requestingUser.email}`);
            return asset;
        } catch (error) {
            logger.error('Create fixed asset error:', error);
            throw error;
        }
    }

    async calculateDepreciation(assetId: string, tanggalHitung?: Date) {
        try {
            const asset = await prisma.asetTetap.findUnique({ where: { id: assetId } });
            if (!asset) throw new ValidationError('Aset tidak ditemukan');

            const tanggal = tanggalHitung || new Date();
            const tanggalPerolehan = new Date(asset.tanggalPerolehan);
            const monthsDiff = (tanggal.getFullYear() - tanggalPerolehan.getFullYear()) * 12 + (tanggal.getMonth() - tanggalPerolehan.getMonth());

            let penyusutanBulanIni = 0;

            if (asset.metodePenyusutan === 'GARIS_LURUS') {
                const nilaiTersusutkan = asset.nilaiPerolehan.toNumber() - asset.nilaiResidu.toNumber();
                const penyusutanPerBulan = nilaiTersusutkan / (asset.umurEkonomis * 12);
                penyusutanBulanIni = penyusutanPerBulan;
                const totalPenyusutan = Math.min(penyusutanPerBulan * monthsDiff, nilaiTersusutkan);

                await prisma.asetTetap.update({
                    where: { id: assetId },
                    data: {
                        akumulasiPenyusutan: totalPenyusutan,
                        nilaiBuku: asset.nilaiPerolehan.toNumber() - totalPenyusutan,
                    },
                });
            }

            const updatedAsset = await prisma.asetTetap.findUnique({ where: { id: assetId } });
            logger.info(`Depreciation calculated for: ${asset.kodeAset}`);

            return {
                asset: updatedAsset,
                depreciation: {
                    jumlahPenyusutan: penyusutanBulanIni,
                    akumulasiPenyusutan: updatedAsset!.akumulasiPenyusutan.toNumber(),
                    nilaiBuku: updatedAsset!.nilaiBuku.toNumber(),
                },
                monthsDepreciated: monthsDiff,
            };
        } catch (error) {
            logger.error('Calculate depreciation error:', error);
            throw error;
        }
    }

    async disposeAsset(assetId: string, data: DisposeAssetInput['body'], requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const asset = await prisma.asetTetap.findUnique({ where: { id: assetId } });
            if (!asset) throw new ValidationError('Aset tidak ditemukan');
            if (asset.status !== 'AKTIF') throw new ValidationError('Aset sudah tidak aktif');

            const gainLoss = data.nilaiPelepasan - asset.nilaiBuku.toNumber();

            const updatedAsset = await prisma.asetTetap.update({
                where: { id: assetId },
                data: {
                    status: 'TIDAK_AKTIF' as any,
                    tanggalPenjualan: typeof data.tanggalPelepasan === 'string' ? new Date(data.tanggalPelepasan) : data.tanggalPelepasan,
                    nilaiPenjualan: data.nilaiPelepasan,
                    catatan: `${asset.catatan || ''}\nPelepasan: ${data.alasan}`,
                },
            });

            logger.info(`Asset disposed: ${asset.kodeAset} by ${requestingUser.email}`);
            return {
                asset: updatedAsset,
                gainLoss,
                message: gainLoss >= 0 ? 'Keuntungan pelepasan aset' : 'Kerugian pelepasan aset',
            };
        } catch (error) {
            logger.error('Dispose asset error:', error);
            throw error;
        }
    }

    async listFixedAssets(filters: ListFixedAssetsInput, requestingUserId: string) {
        try {
            const { page = 1, limit = 20, perusahaanId, kategori, status } = filters;
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const where: Prisma.AsetTetapWhereInput = {};
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (kategori) where.kategori = kategori;
            if (status) where.status = status as any;

            const total = await prisma.asetTetap.count({ where });
            const items = await prisma.asetTetap.findMany({
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
        } catch (error) {
            logger.error('List fixed assets error:', error);
            throw error;
        }
    }

    async getFixedAssetById(id: string, requestingUserId: string): Promise<AsetTetap> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const asset = await prisma.asetTetap.findUnique({
                where: { id },
                include: { supplier: { select: { nama: true, kodePemasok: true } } },
            });

            if (!asset) throw new ValidationError('Aset tidak ditemukan');
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== asset.perusahaanId) {
                throw new AuthenticationError('Anda tidak memiliki akses ke aset ini');
            }

            return asset;
        } catch (error) {
            logger.error('Get fixed asset by ID error:', error);
            throw error;
        }
    }
}

export const fixedAssetService = new FixedAssetService();
