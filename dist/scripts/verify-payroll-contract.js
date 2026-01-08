"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const contract_service_1 = require("../src/services/contract.service");
const employee_service_1 = require("../src/services/employee.service");
const payroll_service_1 = require("../src/services/payroll.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});
async function main() {
    console.log('Starting Payroll & Contract Verification (with PPh21)...');
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
        console.log(`Using Periode: ${periode.nama}`);
        // Ensure Expense/Cash Accounts exist for Payroll
        let expenseAccount = await prisma.chartOfAccounts.findFirst({
            where: { perusahaanId: perusahaan.id, tipe: 'BEBAN', namaAkun: { contains: 'Gaji' } }
        });
        if (!expenseAccount) {
            console.log('Creating Mock Expense Account...');
            expenseAccount = await prisma.chartOfAccounts.create({
                data: {
                    perusahaanId: perusahaan.id,
                    kodeAkun: '6-10001',
                    namaAkun: 'Beban Gaji',
                    tipe: 'BEBAN',
                    normalBalance: 'DEBIT'
                }
            });
        }
        let cashAccount = await prisma.chartOfAccounts.findFirst({
            where: { perusahaanId: perusahaan.id, tipe: 'ASET', kategoriAset: 'KAS_DAN_SETARA_KAS' }
        });
        if (!cashAccount) {
            console.log('Creating Mock Cash Account...');
            cashAccount = await prisma.chartOfAccounts.create({
                data: {
                    perusahaanId: perusahaan.id,
                    kodeAkun: '1-10001',
                    namaAkun: 'Kas Besar',
                    tipe: 'ASET',
                    kategoriAset: 'KAS_DAN_SETARA_KAS',
                    normalBalance: 'DEBIT'
                }
            });
        }
        // 2. Test Contract
        console.log('\n--- Testing Contract Module ---');
        const contractNum = `CTR-TEST-${Date.now()}`;
        const contract = await contract_service_1.contractService.createContract({
            perusahaanId: perusahaan.id,
            nomorKontrak: contractNum,
            namaKontrak: 'Kontrak Kerja Test',
            pihakKedua: 'Employee Candidate',
            tanggalMulai: new Date(),
            tanggalAkhir: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            nilaiKontrak: 120000000,
            jenis: 'PKWT',
            status: 'AKTIF'
        });
        console.log(`✅ Contract Created: ${contract.nomorKontrak} (${contract.id})`);
        // 3. Test Employee
        console.log('\n--- Testing Employee Module ---');
        const nik = `NIK-${Date.now()}`;
        const employee = await employee_service_1.employeeService.createEmployee({
            perusahaanId: perusahaan.id,
            nik,
            nama: 'Budi Test Employee',
            tanggalMasuk: new Date(),
            gajiPokok: 15000000,
            email: `budi.${Date.now()}@test.com`,
            status: 'AKTIF',
            jabatan: 'Staff IT',
            statusPtkp: 'TK/0'
        });
        console.log(`✅ Employee Created: ${employee.nama} (${employee.nik}) - Gaji: ${employee.gajiPokok}`);
        // 4. Test Payroll
        console.log('\n--- Testing Payroll Module ---');
        const periodeStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        // Ensure no existing payroll for this period/employee
        await prisma.penggajian.deleteMany({
            where: { karyawanId: employee.id, periode: periodeStr }
        });
        const payroll = await payroll_service_1.payrollService.createPayroll({
            karyawanId: employee.id,
            periode: periodeStr,
            tanggalBayar: new Date(),
            gajiPokok: 15000000,
            tunjangan: 0,
            lembur: 0,
            bonus: 0,
            potonganBpjs: 0,
            potonganPph21: 0, // Should auto-calc
            potonganLainnya: 0,
            keterangan: 'Payroll Test Auto PPh21'
        });
        console.log(`✅ Payroll Created: ${payroll.id}`);
        console.log(`   - Gaji Pokok: ${payroll.gajiPokok}`);
        console.log(`   - Potongan PPh21: ${payroll.potonganPph21}`);
        console.log(`   - Netto: ${payroll.netto}`);
        if (Number(payroll.potonganPph21) > 900000) {
            console.log(`✅ PPh21 Calculation Verification: SUCCESS (Value > 0.9M approx 1M)`);
        }
        else {
            console.log(`❌ PPh21 Calculation Verification: FAILED (Value too low: ${payroll.potonganPph21})`);
        }
        // 5. Pay Payroll
        console.log('\n--- Testing Payroll Payment & Auto-Journal ---');
        const paidPayroll = await payroll_service_1.payrollService.payPayroll(payroll.id, {
            akunKasId: cashAccount.id,
            akunBebanId: expenseAccount.id
        }, user.id);
        console.log(`✅ Payroll Paid: ${paidPayroll.sudahDibayar}`);
        console.log(`✅ Auto-Journal Status: ${paidPayroll.sudahDijurnal}`);
        // Verify Journal
        const journal = await prisma.jurnalUmum.findFirst({
            where: { deskripsi: { contains: `Pembayaran Gaji ${employee.nama}` } },
            include: { detail: true },
            orderBy: { createdAt: 'desc' }
        });
        if (journal) {
            console.log('✅ Journal Entry Found!');
            console.log('Journal ID:', journal.id);
            console.log('Details:');
            journal.detail.forEach(d => {
                console.log(` - Urutan ${d.urutan}: ${d.deskripsi} (D=${d.debit}, K=${d.kredit})`);
            });
            // Validate Balance
            const totalDebit = journal.detail.reduce((sum, d) => sum + Number(d.debit), 0);
            const totalCredit = journal.detail.reduce((sum, d) => sum + Number(d.kredit), 0);
            console.log(`Balance Check: Debit=${totalDebit}, Credit=${totalCredit} (Diff: ${totalDebit - totalCredit})`);
            if (Math.abs(totalDebit - totalCredit) < 0.01) {
                console.log('✅ Journal Balanced');
            }
            else {
                console.error('❌ Journal UNBALANCED');
            }
        }
        else {
            console.error('❌ Journal Entry NOT Found!');
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
