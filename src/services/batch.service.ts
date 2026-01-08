import prisma from '@/config/database';
import logger from '@/utils/logger';
import { ValidationError } from './auth.service';
import { auditService } from './audit.service';
import type {
    BatchTransactionsInput,
    BatchApprovalsInput,
    BatchPostJournalsInput,
    BatchDeleteInput,
} from '@/validators/batch.validator';

export class BatchService {
    // Batch create transactions
    async processBatchTransactions(data: BatchTransactionsInput, userId: string) {
        const results: any[] = [];
        const errors: any[] = [];

        // Use Prisma transaction for atomicity
        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < data.transactions.length; i++) {
                    const trans = data.transactions[i];

                    try {
                        // Validate balance
                        const totalDebit = trans.details.reduce((sum, d) => sum + d.debit, 0);
                        const totalKredit = trans.details.reduce((sum, d) => sum + d.kredit, 0);

                        if (Math.abs(totalDebit - totalKredit) > 0.01) {
                            throw new Error(`Transaction ${i + 1}: Debit (${totalDebit}) tidak sama dengan Kredit (${totalKredit})`);
                        }

                        // Generate transaction number
                        const count = await tx.transaksi.count({
                            where: { perusahaanId: trans.perusahaanId },
                        });
                        const now = new Date();
                        const nomorTransaksi = `TRX/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(count + i + 1).padStart(4, '0')}`;

                        // Create transaction
                        const created = await tx.transaksi.create({
                            data: {
                                perusahaanId: trans.perusahaanId,
                                penggunaId: userId,
                                nomorTransaksi,
                                tanggal: new Date(trans.tanggal),
                                tipe: trans.tipe,
                                mataUangId: trans.mataUangId,
                                pelangganId: trans.pelangganId,
                                pemasokId: trans.pemasokId,
                                referensi: trans.referensi,
                                deskripsi: trans.deskripsi,
                                total: trans.total,
                                costCenterId: trans.costCenterId,
                                profitCenterId: trans.profitCenterId,
                                statusPembayaran: 'BELUM_DIBAYAR',
                                detail: {
                                    create: trans.details.map((d, idx) => ({
                                        urutan: idx + 1,
                                        akunId: d.akunId,
                                        deskripsi: d.deskripsi,
                                        kuantitas: d.kuantitas,
                                        hargaSatuan: d.hargaSatuan,
                                        subtotal: d.debit || d.kredit,
                                        debit: d.debit,
                                        kredit: d.kredit,
                                    })),
                                },
                            },
                        });

                        results.push({ index: i, id: created.id, nomorTransaksi: created.nomorTransaksi });
                    } catch (error: any) {
                        errors.push({ index: i, error: error.message });
                        throw error; // Rollback entire batch
                    }
                }
            });

            logger.info(`Batch created ${results.length} transactions`);
            return { success: true, results, errors: [] };
        } catch (error: any) {
            logger.error('Batch transaction creation failed:', error);
            throw new ValidationError(`Batch gagal: ${error.message}. Semua operasi dibatalkan.`);
        }
    }

    // Batch process approvals
    async processBatchApprovals(data: BatchApprovalsInput, userId: string) {
        const results: any[] = [];
        const errors: any[] = [];

        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < data.approvalIds.length; i++) {
                    const approvalId = data.approvalIds[i];

                    try {
                        const approval = await tx.approvalFlow.findUnique({
                            where: { id: approvalId },
                        });

                        if (!approval) {
                            throw new Error(`Approval ${approvalId} tidak ditemukan`);
                        }

                        if (approval.status !== 'PENDING') {
                            throw new Error(`Approval ${approvalId} sudah diproses`);
                        }

                        const newStatus = data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

                        await tx.approvalFlow.update({
                            where: { id: approvalId },
                            data: {
                                status: newStatus,
                                catatan: data.catatan,
                            },
                        });

                        results.push({ index: i, id: approvalId, status: newStatus });
                    } catch (error: any) {
                        errors.push({ index: i, id: approvalId, error: error.message });
                        throw error;
                    }
                }
            });

            logger.info(`Batch processed ${results.length} approvals`);
            return { success: true, results, errors: [] };
        } catch (error: any) {
            logger.error('Batch approval processing failed:', error);
            throw new ValidationError(`Batch approval gagal: ${error.message}`);
        }
    }

    // Batch post journals
    async processBatchJournalPosting(data: BatchPostJournalsInput, userId: string) {
        const results: any[] = [];
        const errors: any[] = [];

        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < data.jurnalIds.length; i++) {
                    const jurnalId = data.jurnalIds[i];

                    try {
                        const jurnal = await tx.jurnalUmum.findUnique({
                            where: { id: jurnalId },
                        });

                        if (!jurnal) {
                            throw new Error(`Jurnal ${jurnalId} tidak ditemukan`);
                        }

                        if (jurnal.isPosted) {
                            throw new Error(`Jurnal ${jurnalId} sudah diposting`);
                        }

                        await tx.jurnalUmum.update({
                            where: { id: jurnalId },
                            data: {
                                isPosted: true,
                                postedAt: new Date(),
                            },
                        });

                        results.push({ index: i, id: jurnalId, status: 'POSTED' });
                    } catch (error: any) {
                        errors.push({ index: i, id: jurnalId, error: error.message });
                        throw error;
                    }
                }
            });

            logger.info(`Batch posted ${results.length} journals`);
            return { success: true, results, errors: [] };
        } catch (error: any) {
            logger.error('Batch journal posting failed:', error);
            throw new ValidationError(`Batch posting gagal: ${error.message}`);
        }
    }

    // Batch delete
    async processBatchDelete(data: BatchDeleteInput, userId: string) {
        const results: any[] = [];
        const errors: any[] = [];

        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < data.ids.length; i++) {
                    const id = data.ids[i];

                    try {
                        switch (data.entityType) {
                            case 'TRANSAKSI':
                                await tx.transaksi.delete({ where: { id } });
                                break;
                            case 'VOUCHER':
                                await tx.voucher.delete({ where: { id } });
                                break;
                            case 'JURNAL':
                                const jurnal = await tx.jurnalUmum.findUnique({ where: { id } });
                                if (jurnal?.isPosted && !data.force) {
                                    throw new Error('Jurnal sudah diposting, gunakan force=true');
                                }
                                await tx.jurnalUmum.delete({ where: { id } });
                                break;
                            case 'DOKUMEN':
                                await tx.dokumenTransaksi.delete({ where: { id } });
                                break;
                        }

                        results.push({ index: i, id, status: 'DELETED' });
                    } catch (error: any) {
                        errors.push({ index: i, id, error: error.message });
                        throw error;
                    }
                }
            });

            logger.info(`Batch deleted ${results.length} ${data.entityType} records`);
            return { success: true, results, errors: [] };
        } catch (error: any) {
            logger.error('Batch delete failed:', error);
            throw new ValidationError(`Batch delete gagal: ${error.message}`);
        }
    }
}

export const batchService = new BatchService();
