import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // Create default company
  const perusahaan = await prisma.perusahaan.upsert({
    where: { kode: 'DEMO' },
    update: {},
    create: {
      kode: 'DEMO',
      nama: 'PT Demo Akuntansi',
      namaLengkap: 'PT Demo Akuntansi Indonesia',
      bentukUsaha: 'PT',
      bidangUsaha: 'Software & Technology',
      alamat: 'Jl. Sudirman No. 123',
      kota: 'Jakarta',
      provinsi: 'DI Jakarta',
      kodePos: '12345',
      email: 'demo@akuntansi.id',
      mataUangUtama: 'IDR',
      npwp: '01.234.567.8-901.000',
    },
  });

  console.log('✅ Company created:', perusahaan.nama);

  // Create company settings
  await prisma.pengaturanPerusahaan.upsert({
    where: { perusahaanId: perusahaan.id },
    update: {},
    create: {
      perusahaanId: perusahaan.id,
      metodeAkuntansi: 'ACCRUAL',
      metodeInventory: 'RATA_RATA_BERGERAK',
      metodePenyusutan: 'GARIS_LURUS',
      useMultiCurrency: false,
      useMultiWarehouse: false,
      useCostCenter: false,
      useProfitCenter: false,
      autoNumberingVoucher: true,
      autoNumberingInvoice: true,
    },
  });

  console.log('✅ Company settings created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.pengguna.upsert({
    where: { email: 'admin@akuntansi.id' },
    update: {},
    create: {
      perusahaanId: perusahaan.id,
      username: 'admin',
      email: 'admin@akuntansi.id',
      password: hashedPassword,
      namaLengkap: 'Administrator',
      role: 'SUPERADMIN',
      isAktif: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create basic Chart of Accounts (PSAK compliant)
  const coa = [
    // ASET
    { kode: '1', nama: 'ASET', tipe: 'ASET', isHeader: true, level: 1 },
    { kode: '11', nama: 'ASET LANCAR', tipe: 'ASET', kategoriAset: 'ASET_LANCAR', isHeader: true, level: 2, parentKode: '1' },
    { kode: '1101', nama: 'Kas', tipe: 'ASET', kategoriAset: 'KAS_DAN_SETARA_KAS', level: 3, parentKode: '11', normalBalance: 'DEBIT' },
    { kode: '1102', nama: 'Bank', tipe: 'ASET', kategoriAset: 'KAS_DAN_SETARA_KAS', level: 3, parentKode: '11', normalBalance: 'DEBIT' },
    { kode: '1103', nama: 'Piutang Usaha', tipe: 'ASET', kategoriAset: 'PIUTANG_USAHA', level: 3, parentKode: '11', normalBalance: 'DEBIT' },
    { kode: '1104', nama: 'Persediaan Barang Dagang', tipe: 'ASET', kategoriAset: 'PERSEDIAAN', level: 3, parentKode: '11', normalBalance: 'DEBIT' },

    { kode: '12', nama: 'ASET TIDAK LANCAR', tipe: 'ASET', kategoriAset: 'ASET_TIDAK_LANCAR', isHeader: true, level: 2, parentKode: '1' },
    { kode: '1201', nama: 'Aset Tetap', tipe: 'ASET', kategoriAset: 'ASET_TETAP', level: 3, parentKode: '12', normalBalance: 'DEBIT' },
    { kode: '1202', nama: 'Akumulasi Penyusutan', tipe: 'ASET', kategoriAset: 'ASET_TETAP', level: 3, parentKode: '12', normalBalance: 'KREDIT' },

    // LIABILITAS
    { kode: '2', nama: 'LIABILITAS', tipe: 'LIABILITAS', isHeader: true, level: 1 },
    { kode: '21', nama: 'LIABILITAS JANGKA PENDEK', tipe: 'LIABILITAS', kategoriLiabilitas: 'LIABILITAS_JANGKA_PENDEK', isHeader: true, level: 2, parentKode: '2' },
    { kode: '2101', nama: 'Hutang Usaha', tipe: 'LIABILITAS', kategoriLiabilitas: 'HUTANG_USAHA', level: 3, parentKode: '21', normalBalance: 'KREDIT' },
    { kode: '2102', nama: 'Hutang Pajak', tipe: 'LIABILITAS', kategoriLiabilitas: 'HUTANG_PAJAK', level: 3, parentKode: '21', normalBalance: 'KREDIT' },

    // EKUITAS
    { kode: '3', nama: 'EKUITAS', tipe: 'EKUITAS', isHeader: true, level: 1 },
    { kode: '3101', nama: 'Modal Saham', tipe: 'EKUITAS', kategoriEkuitas: 'MODAL_SAHAM', level: 2, parentKode: '3', normalBalance: 'KREDIT' },
    { kode: '3201', nama: 'Saldo Laba', tipe: 'EKUITAS', kategoriEkuitas: 'SALDO_LABA', level: 2, parentKode: '3', normalBalance: 'KREDIT' },

    // PENDAPATAN
    { kode: '4', nama: 'PENDAPATAN', tipe: 'PENDAPATAN', isHeader: true, level: 1 },
    { kode: '4101', nama: 'Pendapatan Usaha', tipe: 'PENDAPATAN', level: 2, parentKode: '4', normalBalance: 'KREDIT' },
    { kode: '4201', nama: 'Pendapatan Lain-lain', tipe: 'PENDAPATAN', level: 2, parentKode: '4', normalBalance: 'KREDIT' },

    // BEBAN
    { kode: '5', nama: 'BEBAN', tipe: 'BEBAN', isHeader: true, level: 1 },
    { kode: '5101', nama: 'Beban Pokok Penjualan', tipe: 'BEBAN', level: 2, parentKode: '5', normalBalance: 'DEBIT' },
    { kode: '5201', nama: 'Beban Gaji', tipe: 'BEBAN', level: 2, parentKode: '5', normalBalance: 'DEBIT' },
    { kode: '5202', nama: 'Beban Sewa', tipe: 'BEBAN', level: 2, parentKode: '5', normalBalance: 'DEBIT' },
    { kode: '5203', nama: 'Beban Listrik & Air', tipe: 'BEBAN', level: 2, parentKode: '5', normalBalance: 'DEBIT' },
    { kode: '5204', nama: 'Beban Penyusutan', tipe: 'BEBAN', level: 2, parentKode: '5', normalBalance: 'DEBIT' },
  ];

  // Create COA with proper parent relationships
  const coaMap = new Map<string, string>();

  for (const account of coa) {
    let parentId: string | undefined = undefined;

    if (account.parentKode && coaMap.has(account.parentKode)) {
      parentId = coaMap.get(account.parentKode);
    }

    const created = await prisma.chartOfAccounts.upsert({
      where: {
        perusahaanId_kodeAkun: {
          perusahaanId: perusahaan.id,
          kodeAkun: account.kode,
        },
      },
      update: {},
      create: {
        perusahaanId: perusahaan.id,
        kodeAkun: account.kode,
        namaAkun: account.nama,
        tipe: account.tipe as any,
        kategoriAset: account.kategoriAset as any,
        kategoriLiabilitas: account.kategoriLiabilitas as any,
        kategoriEkuitas: account.kategoriEkuitas as any,
        level: account.level,
        parentId,
        normalBalance: account.normalBalance || 'DEBIT',
        isHeader: account.isHeader || false,
        isActive: true,
        allowManualEntry: !account.isHeader,
      },
    });

    coaMap.set(account.kode, created.id);
  }

  console.log(`✅ Created ${coa.length} Chart of Accounts`);

  // Create default subscription package
  const umkmPackage = await prisma.paketFitur.upsert({
    where: { kode: 'UMKM' },
    update: {},
    create: {
      kode: 'UMKM',
      nama: 'Paket UMKM',
      deskripsi: 'Paket untuk Usaha Mikro, Kecil, dan Menengah',
      tier: 'UMKM',
      hargaBulanan: 99000,
      hargaTahunan: 990000,
      maxUser: 2,
      maxTransaksiPerBulan: 100,
      maxStorageGB: 1,
      maxCabang: 1,
      isPublik: true,
      isAktif: true,
    },
  });

  console.log('✅ UMKM package created');

  // Create basic features
  const basicFeatures = [
    { kodeModul: 'BASIC_ACCOUNTING', namaModul: 'Akuntansi Dasar', deskripsi: 'COA, Transaksi, Jurnal' },
    { kodeModul: 'FINANCIAL_REPORTS', namaModul: 'Laporan Keuangan', deskripsi: 'Neraca, Laba Rugi' },
    { kodeModul: 'CUSTOMER_SUPPLIER', namaModul: 'Pelanggan & Pemasok', deskripsi: 'Manajemen mitra' },
    { kodeModul: 'TAX_MANAGEMENT', namaModul: 'Manajemen Pajak', deskripsi: 'PPh, PPN' },
  ];

  for (const feature of basicFeatures) {
    await prisma.fiturModul.upsert({
      where: {
        paketId_kodeModul: {
          paketId: umkmPackage.id,
          kodeModul: feature.kodeModul,
        },
      },
      update: {},
      create: {
        paketId: umkmPackage.id,
        kodeModul: feature.kodeModul,
        namaModul: feature.namaModul,
        deskripsi: feature.deskripsi,
        isAktif: true,
      },
    });
  }

  console.log('✅ Basic features created');

  // Assign package to company
  const today = new Date();
  const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  await prisma.perusahaanPaket.upsert({
    where: {
      perusahaanId_paketId_tanggalMulai: {
        perusahaanId: perusahaan.id,
        paketId: umkmPackage.id,
        tanggalMulai: today,
      },
    },
    update: {},
    create: {
      perusahaanId: perusahaan.id,
      paketId: umkmPackage.id,
      tanggalMulai: today,
      tanggalAkhir: oneYearLater,
      isAktif: true,
      isTrial: true,
    },
  });

  console.log('✅ Package assigned to company');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@akuntansi.id');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
