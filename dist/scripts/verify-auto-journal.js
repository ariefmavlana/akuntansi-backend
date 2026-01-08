"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const transaction_service_1 = require("../src/services/transaction.service");
const voucher_service_1 = require("../src/services/voucher.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});
async function main() {
    console.log('Starting Auto-Journal Verification...');
    try {
        // 1. Setup Data
        console.log('Setting up test data...');
        const user = await prisma.pengguna.findFirst();
        if (!user)
            throw new Error('No user found');
        const perusahaan = await prisma.perusahaan.findFirst();
        if (!perusahaan)
            throw new Error('No company found');
        // Ensure Period exists
        const today = new Date();
        const periode = await prisma.periodeAkuntansi.upsert({
            where: {
                perusahaanId_tahun_bulan: {
                    perusahaanId: perusahaan.id,
                    bulan: today.getMonth() + 1,
                    tahun: today.getFullYear()
                }
            },
            update: { status: 'TERBUKA' },
            create: {
                perusahaanId: perusahaan.id,
                bulan: today.getMonth() + 1,
                tahun: today.getFullYear(),
                nama: `Periode Test ${today.getMonth() + 1}/${today.getFullYear()}`,
                tanggalMulai: new Date(today.getFullYear(), today.getMonth(), 1),
                tanggalAkhir: new Date(today.getFullYear(), today.getMonth() + 1, 0),
                status: 'TERBUKA'
            }
        });
        // Ensure Accounts exist
        // Need AR Account
        let arAccount = await prisma.chartOfAccounts.findFirst({
            where: { perusahaanId: perusahaan.id, kategoriAset: 'PIUTANG_USAHA' }
        });
        if (!arAccount) {
            console.log('Creating Mock AR Account...');
            arAccount = await prisma.chartOfAccounts.create({
                data: {
                    perusahaanId: perusahaan.id,
                    kodeAkun: '1-10001',
                    namaAkun: 'Piutang Usaha Test',
                    tipe: 'ASET',
                    kategoriAset: 'PIUTANG_USAHA',
                    normalBalance: 'DEBIT'
                }
            });
        }
        // Need Income Account
        let incomeAccount = await prisma.chartOfAccounts.findFirst({
            where: { perusahaanId: perusahaan.id, tipe: 'PENDAPATAN' }
        });
        if (!incomeAccount) {
            console.log('Creating Mock Income Account...');
            incomeAccount = await prisma.chartOfAccounts.create({
                data: {
                    perusahaanId: perusahaan.id,
                    kodeAkun: '4-10001',
                    namaAkun: 'Pendapatan Jasa Test',
                    tipe: 'PENDAPATAN',
                    normalBalance: 'CREDIT'
                }
            });
        }
        // 2. Test Transaction Posting
        console.log('\n--- Testing Transaction Posting ---');
        // Create Transaction
        const transaction = await prisma.transaksi.create({
            data: {
                perusahaanId: perusahaan.id,
                tipe: 'PENJUALAN',
                tanggal: new Date(),
                tanggalJatuhTempo: new Date(),
                nomorTransaksi: `TRX-TEST-${Date.now()}`,
                total: 100000,
                subtotal: 100000,
                nilaiPajak: 0,
                penggunaId: user.id,
                detail: {
                    create: {
                        urutan: 1,
                        deskripsi: 'Jasa Test',
                        kuantitas: 1,
                        hargaSatuan: 100000,
                        subtotal: 100000,
                        akunId: incomeAccount.id
                    }
                }
            }
        });
        console.log(`Created Transaction: ${transaction.nomorTransaksi} (${transaction.id})`);
        // Post Transaction
        console.log('Posting Transaction...');
        await transaction_service_1.transactionService.postTransaction(transaction.id, {}, user.id);
        // Verify Journal
        const journalTrx = await prisma.jurnalUmum.findFirst({
            where: { deskripsi: { contains: transaction.nomorTransaksi } },
            include: { detail: true }
        });
        if (journalTrx) {
            console.log('✅ Journal created successfully for Transaction!');
            console.log('Journal ID:', journalTrx.id);
            console.log('Total Debit:', journalTrx.totalDebit.toString());
            console.log('Details:', journalTrx.detail.length);
            journalTrx.detail.forEach(d => {
                console.log(` - ${d.deskripsi}: D=${d.debit}, K=${d.kredit}`);
            });
        }
        else {
            console.error('❌ Failed to create journal for Transaction');
        }
        // 3. Test Voucher Posting
        console.log('\n--- Testing Voucher Posting ---');
        // Create Voucher
        const voucher = await prisma.voucher.create({
            data: {
                perusahaanId: perusahaan.id,
                tipe: 'JURNAL_UMUM',
                status: 'DRAFT', // Service expects DRAFT? Or DISETUJUI? 
                // Checks usually forbid posting DRAFT, checking service logic...
                // postVoucher checks: if (voucher.status !== StatusVoucher.DISETUJUI) ...
                tanggal: new Date(),
                nomorVoucher: `VCH-TEST-${Date.now()}`,
                totalDebit: 100000,
                totalKredit: 100000,
                deskripsi: 'Voucher Test Auto Journal',
                dibuatOlehId: user.id,
                detail: {
                    create: [
                        {
                            urutan: 1,
                            akunId: arAccount.id,
                            deskripsi: 'Debit Side',
                            debit: 100000,
                            kredit: 0
                        },
                        {
                            urutan: 2,
                            akunId: incomeAccount.id,
                            deskripsi: 'Credit Side',
                            debit: 0,
                            kredit: 100000
                        }
                    ]
                }
            }
        });
        // Set status to DISETUJUI manually because we skipped approval flow
        await prisma.voucher.update({
            where: { id: voucher.id },
            data: { status: 'DISETUJUI' }
        });
        console.log(`Created Voucher: ${voucher.nomorVoucher} (${voucher.id})`);
        // Post Voucher
        console.log('Posting Voucher...');
        await voucher_service_1.voucherService.postVoucher(voucher.id, {}, user.id);
        // Verify Journal
        const journalVch = await prisma.jurnalUmum.findFirst({
            where: { voucherId: voucher.id },
            include: { detail: true }
        });
        if (journalVch) {
            console.log('✅ Journal created successfully for Voucher!');
            console.log('Journal ID:', journalVch.id);
            console.log('Details:', journalVch.detail.length);
        }
        else {
            console.error('❌ Failed to create journal for Voucher');
        }
    }
    catch (error) {
        console.error('Test Failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
