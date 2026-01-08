"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting transaction seed...');
    // 1. Get Default Company
    const company = await prisma.perusahaan.findUnique({
        where: { kode: 'DEMO' },
    });
    if (!company) {
        throw new Error('❌ Default company (DEMO) not found. Please run prisma/seed.ts first.');
    }
    // 2. Get Admin User
    const admin = await prisma.pengguna.findUnique({
        where: { email: 'admin@akuntansi.id' },
    });
    if (!admin) {
        throw new Error('❌ Admin user not found. Please run prisma/seed.ts first.');
    }
    // 3. Create Customers (Pelanggan)
    console.log('Creating Customers...');
    const customersData = [
        { kode: 'CUST-001', nama: 'PT Cahaya Abadi', email: 'contact@cahayaabadi.com', telepon: '021-555001', alamat: 'Jl. Surya Kencana No. 10', termin: 30 },
        { kode: 'CUST-002', nama: 'CV Makmur Jaya', email: 'info@makmurjaya.co.id', telepon: '021-555002', alamat: 'Jl. Gajah Mada No. 45', termin: 14 },
    ];
    for (const cust of customersData) {
        const exists = await prisma.pelanggan.findFirst({ where: { email: cust.email } });
        if (!exists) {
            await prisma.pelanggan.create({
                data: {
                    perusahaanId: company.id,
                    kodePelanggan: cust.kode,
                    nama: cust.nama,
                    email: cust.email,
                    telepon: cust.telepon,
                    alamat: cust.alamat,
                    termPembayaran: cust.termin,
                    batasKredit: 100000000,
                },
            });
        }
    }
    // 4. Create Suppliers (Pemasok)
    console.log('Creating Suppliers...');
    const suppliersData = [
        { kode: 'SUPP-001', nama: 'PT Electronic Solution', email: 'sales@es.com', telepon: '021-666001', alamat: 'Kawasan Industri Pulogadung', termin: 30 },
    ];
    for (const supp of suppliersData) {
        const exists = await prisma.pemasok.findFirst({ where: { email: supp.email } });
        if (!exists) {
            await prisma.pemasok.create({
                data: {
                    perusahaanId: company.id,
                    kodePemasok: supp.kode,
                    nama: supp.nama,
                    email: supp.email,
                    telepon: supp.telepon,
                    alamat: supp.alamat,
                    termPembayaran: supp.termin,
                },
            });
        }
    }
    // 5. Create Inventory/Products (Persediaan)
    console.log('Creating Inventory Items...');
    const productsData = [
        { kode: 'NB-001', nama: 'Laptop Thinkpad X1', hargaBeli: 15000000, hargaJual: 20000000, satuan: 'Unit', kategori: 'ELECTRONICS' },
        { kode: 'MO-001', nama: 'Mouse Logitech', hargaBeli: 100000, hargaJual: 150000, satuan: 'Pcs', kategori: 'ACCESSORIES' },
    ];
    const akunPersediaan = await prisma.chartOfAccounts.findFirst({ where: { perusahaanId: company.id, kodeAkun: '1104' } });
    const akunPenjualan = await prisma.chartOfAccounts.findFirst({ where: { perusahaanId: company.id, kodeAkun: '4101' } });
    // Note: Removed account links in Persediaan creation as they don't seem to be in the schema model directly.
    for (const prod of productsData) {
        const exists = await prisma.persediaan.findFirst({ where: { perusahaanId: company.id, kodePersediaan: prod.kode } });
        if (!exists) {
            await prisma.persediaan.create({
                data: {
                    perusahaanId: company.id,
                    kodePersediaan: prod.kode, // Fixed field name
                    namaPersediaan: prod.nama, // Fixed field name
                    kategori: prod.kategori, // Added required field
                    hargaBeli: prod.hargaBeli,
                    hargaJual: prod.hargaJual,
                    satuan: prod.satuan,
                },
            });
        }
    }
    // 6. Create Transactions
    console.log('Creating Transactions...');
    const supplier = await prisma.pemasok.findFirst({ where: { perusahaanId: company.id } });
    const product = await prisma.persediaan.findFirst({ where: { perusahaanId: company.id, kodePersediaan: 'NB-001' } }); // Fixed field name
    if (supplier && product && akunPersediaan) {
        // Check for existing PO to avoid duplicates
        const exists = await prisma.transaksi.findFirst({ where: { nomorTransaksi: 'PO-202401-001' } });
        if (!exists) {
            const purchaseTrx = await prisma.transaksi.create({
                data: {
                    perusahaanId: company.id,
                    penggunaId: admin.id,
                    nomorTransaksi: 'PO-202401-001',
                    tanggal: new Date(),
                    tipe: client_1.TipeTransaksi.PEMBELIAN,
                    pemasokId: supplier.id,
                    deskripsi: 'Pembelian Stok Laptop Awal Tahun',
                    subtotal: 75000000,
                    total: 75000000,
                    statusPembayaran: client_1.StatusPembayaran.BELUM_DIBAYAR,
                    detail: {
                        create: [{
                                urutan: 1,
                                akunId: akunPersediaan.id,
                                kuantitas: 5,
                                hargaSatuan: 15000000,
                                subtotal: 75000000,
                                persediaanId: product.id,
                                deskripsi: 'Laptop Thinkpad X1'
                            }]
                    }
                }
            });
            console.log(`✅ Created Purchase: ${purchaseTrx.nomorTransaksi}`);
        }
    }
    const customer = await prisma.pelanggan.findFirst({ where: { perusahaanId: company.id } });
    if (customer && product && akunPenjualan) {
        const exists = await prisma.transaksi.findFirst({ where: { nomorTransaksi: 'INV-202401-001' } });
        if (!exists) {
            const salesTrx = await prisma.transaksi.create({
                data: {
                    perusahaanId: company.id,
                    penggunaId: admin.id,
                    nomorTransaksi: 'INV-202401-001',
                    tanggal: new Date(),
                    tipe: client_1.TipeTransaksi.PENJUALAN,
                    pelangganId: customer.id,
                    deskripsi: 'Penjualan 2 Unit Laptop',
                    subtotal: 40000000,
                    total: 40000000,
                    statusPembayaran: client_1.StatusPembayaran.LUNAS,
                    detail: {
                        create: [{
                                urutan: 1,
                                akunId: akunPenjualan.id,
                                kuantitas: 2,
                                hargaSatuan: 20000000,
                                subtotal: 40000000,
                                persediaanId: product.id,
                                deskripsi: 'Laptop Thinkpad X1'
                            }]
                    }
                }
            });
            // Create Payment
            await prisma.pembayaran.create({
                data: {
                    // perusahaanId removed, handled by relation to Transaksi? 
                    // Use transaksiId to link.
                    transaksiId: salesTrx.id,
                    nomorPembayaran: 'PAY-202401-001',
                    tanggal: new Date(),
                    jumlah: 40000000,
                    tipePembayaran: client_1.TipePembayaran.TRANSFER_BANK,
                    keterangan: 'Pelunasan Invoice 001'
                }
            });
            console.log(`✅ Created Sales: ${salesTrx.nomorTransaksi} + Payment`);
        }
    }
    console.log('🎉 Transaction Seed Completed!');
}
main()
    .catch((e) => {
    console.error('❌ Error during transaction seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
