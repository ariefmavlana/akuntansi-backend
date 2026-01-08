"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const inventory_service_1 = require("../src/services/inventory.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});
async function main() {
    console.log('Starting Inventory Verification...');
    try {
        // 1. Setup Data
        console.log('Setting up test data...');
        const user = await prisma.pengguna.findFirst({ where: { role: 'SUPERADMIN' } });
        if (!user)
            throw new Error('No SUPERADMIN found. Please seed db.');
        const perusahaan = await prisma.perusahaan.findFirst();
        if (!perusahaan)
            throw new Error('No company found');
        // Create Item
        const itemCode = `ITEM-${Date.now()}`;
        const item = await inventory_service_1.inventoryService.createInventory({
            perusahaanId: perusahaan.id,
            kodeBarang: itemCode,
            namaBarang: 'Test Item Avg Cost',
            satuan: 'PCS',
            hargaBeli: 0,
            hargaJual: 5000,
            stokMinimal: 5,
            stokAwal: 0
        }, user.id);
        console.log(`✅ Item Created: ${item.kodePersediaan}`);
        // 2. Stock IN 1 (10 @ 1000)
        console.log('\n--- Test 1: First Stock IN (10 @ 1000) ---');
        const res1 = await inventory_service_1.inventoryService.recordStockMovement({
            inventoryId: item.id,
            tipe: 'MASUK',
            jumlah: 10,
            harga: 1000,
            keterangan: 'Initial Stock'
        }, user.id);
        console.log(`New Qty: ${res1.stockRecord.kuantitas}`);
        console.log(`New Avg: ${res1.stockRecord.hargaRataRata}`);
        if (Number(res1.stockRecord.hargaRataRata) === 1000) {
            console.log('✅ Avg Cost Correct (1000)');
        }
        else {
            console.error(`❌ Avg Cost Incorrect: ${res1.stockRecord.hargaRataRata}`);
        }
        // 3. Stock IN 2 (10 @ 2000)
        console.log('\n--- Test 2: Second Stock IN (10 @ 2000) ---');
        // Expected: (10*1000 + 10*2000) / 20 = 30000 / 20 = 1500
        const res2 = await inventory_service_1.inventoryService.recordStockMovement({
            inventoryId: item.id,
            tipe: 'MASUK',
            jumlah: 10,
            harga: 2000,
            keterangan: 'Second Stock'
        }, user.id);
        console.log(`New Qty: ${res2.stockRecord.kuantitas}`);
        console.log(`New Avg: ${res2.stockRecord.hargaRataRata}`);
        if (Number(res2.stockRecord.hargaRataRata) === 1500) {
            console.log('✅ Avg Cost Correct (1500)');
        }
        else {
            console.error(`❌ Avg Cost Incorrect: ${res2.stockRecord.hargaRataRata}`);
        }
        // 4. Stock OUT (5)
        console.log('\n--- Test 3: Stock OUT (5) ---');
        const res3 = await inventory_service_1.inventoryService.recordStockMovement({
            inventoryId: item.id,
            tipe: 'KELUAR',
            jumlah: 5,
            keterangan: 'Sales'
        }, user.id);
        console.log(`New Qty: ${res3.stockRecord.kuantitas}`);
        // Avg Cost should NOT change
        if (Number(res3.stockRecord.hargaRataRata) === 1500) {
            console.log('✅ Avg Cost Unchanged (1500)');
        }
        else {
            console.error(`❌ Avg Cost Changed Incorrectly: ${res3.stockRecord.hargaRataRata}`);
        }
        // 5. Stock OUT Error (> Balance)
        console.log('\n--- Test 4: Over Stock OUT (20) ---');
        try {
            await inventory_service_1.inventoryService.recordStockMovement({
                inventoryId: item.id,
                tipe: 'KELUAR',
                jumlah: 20, // Only 15 left
                keterangan: 'Fail Test'
            }, user.id);
            console.error('❌ Failed: Should have thrown error');
        }
        catch (e) {
            if (e.message.includes('Stok tidak mencukupi')) {
                console.log('✅ Success: Caught expected error (Stok tidak mencukupi)');
            }
            else {
                console.error('❌ Caught unexpected error:', e);
            }
        }
    }
    catch (error) {
        console.error('Verification Failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
