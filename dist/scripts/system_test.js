"use strict";
// @ts-nocheck
const BASE_URL = 'http://127.0.0.1:5000/api/v1'; // Adjust if running on different port
const ADMIN_EMAIL = 'admin@akuntansi.id';
const ADMIN_PASSWORD = 'admin123';
// Helper for colored logs
const log = {
    pass: (msg) => console.log(`✅ ${msg}`),
    fail: (msg) => console.error(`❌ ${msg}`),
    info: (msg) => console.log(`ℹ️  ${msg}`),
    section: (msg) => console.log(`\n🔹 --- ${msg} ---`),
};
// Global Store
let ACCESS_TOKEN = '';
let HEADERS = {};
let DATA = {};
async function testAuth() {
    log.section('AUTHENTICATION');
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Login failed: ${res.statusText} - ${JSON.stringify(err)}`);
        }
        const response = await res.json();
        // API returns { success: true, data: { accessToken: ... } }
        if (!response.data || !response.data.accessToken) {
            throw new Error(`No access token returned. Response: ${JSON.stringify(response)}`);
        }
        ACCESS_TOKEN = response.data.accessToken;
        HEADERS = {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        };
        log.pass(`Logged in as ${ADMIN_EMAIL}`);
        return true;
    }
    catch (error) {
        log.fail(error.message);
        return false;
    }
}
async function testMasterData() {
    log.section('MASTER DATA');
    try {
        // 1. COA
        const resCoa = await fetch(`${BASE_URL}/coa`, { headers: HEADERS });
        if (!resCoa.ok)
            throw new Error(`Get COA failed`);
        const coaRes = await resCoa.json();
        const coaData = coaRes.data || [];
        const assetAccount = coaData.find((a) => a.tipe === 'ASET');
        if (assetAccount)
            log.pass(`Fetched ${coaData.length} Accounts`);
        else
            log.fail('COA list seems empty or invalid');
        // Store some IDs for later
        const persediaanAcc = coaData.find((a) => a.kodeAkun === '1104'); // Adjust code if needed
        if (persediaanAcc)
            DATA.akunPersediaanId = persediaanAcc.id;
        // 2. Customers
        const resCust = await fetch(`${BASE_URL}/customers`, { headers: HEADERS });
        if (!resCust.ok)
            throw new Error(`Get Customers failed`);
        const custRes = await resCust.json();
        const custData = custRes.data || [];
        if (custData.length > 0) {
            log.pass(`Fetched ${custData.length} Customers`);
            DATA.customerId = custData[0].id; // Use first customer
        }
        else {
            log.fail('No customers found! Seed data missing?');
        }
        // 3. Suppliers
        const resSupp = await fetch(`${BASE_URL}/suppliers`, { headers: HEADERS });
        if (!resSupp.ok)
            throw new Error(`Get Suppliers failed`);
        const suppRes = await resSupp.json();
        const suppData = suppRes.data || [];
        if (suppData.length > 0) {
            log.pass(`Fetched ${suppData.length} Suppliers`);
            DATA.supplierId = suppData[0].id; // Use first supplier
        }
        else {
            log.fail('No suppliers found!');
        }
        // 4. Products
        const resProd = await fetch(`${BASE_URL}/inventory`, { headers: HEADERS });
        if (!resProd.ok)
            throw new Error(`Get Inventory failed`);
        const prodRes = await resProd.json();
        const prodData = prodRes.data || [];
        if (prodData.length > 0) {
            log.pass(`Fetched ${prodData.length} Products`);
            DATA.productId = prodData[0].id;
            DATA.productPrice = prodData[0].hargaBeli;
        }
        else {
            log.fail('No products found!');
        }
        return true;
    }
    catch (error) {
        log.fail(error.message);
        return false;
    }
}
async function testTransactions() {
    log.section('TRANSACTIONS');
    try {
        if (!DATA.supplierId || !DATA.productId) {
            throw new Error('Missing master data for transactions (Supplier/Product)');
        }
        // 1. Purchase
        const purchasePayload = {
            tipe: 'PEMBELIAN',
            pemasokId: DATA.supplierId,
            tanggal: new Date().toISOString(),
            detail: [
                {
                    akunId: DATA.akunPersediaanId,
                    kuantitas: 1,
                    hargaSatuan: Number(DATA.productPrice) || 100000,
                    subtotal: Number(DATA.productPrice) || 100000,
                    persediaanId: DATA.productId
                }
            ]
        };
        const resPurch = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(purchasePayload)
        });
        if (!resPurch.ok) {
            const err = await resPurch.json();
            throw new Error(`Create Purchase Failed: ${JSON.stringify(err)}`);
        }
        const purchRes = await resPurch.json();
        // Assuming response structure: { data: { nomorTransaksi: ... } }
        log.pass(`Created Purchase: ${purchRes.data ? purchRes.data.nomorTransaksi : 'Unknown Ref'}`);
        // 2. Sales
        if (!DATA.customerId)
            throw new Error('Missing Customer ID');
        const salesPayload = {
            tipe: 'PENJUALAN',
            pelangganId: DATA.customerId,
            tanggal: new Date().toISOString(),
            detail: [
                {
                    // Need Sales Income Account
                    accountId: undefined,
                    kuantitas: 1,
                    hargaSatuan: 25000000,
                    subtotal: 25000000,
                    persediaanId: DATA.productId
                }
            ]
        };
        // We need an account ID for the line item.
        const resCoa = await fetch(`${BASE_URL}/coa?keyword=Pendapatan`, { headers: HEADERS });
        if (resCoa.ok) {
            const coaRes = await resCoa.json();
            const coaData = coaRes.data || [];
            // Try explicit code 4101 (Pendapatan Usaha) or first Income account
            const incAcc = coaData.find((a) => a.kodeAkun === '4101' || a.tipe === 'PENDAPATAN');
            if (incAcc) {
                // @ts-ignore
                salesPayload.detail[0].akunId = incAcc.id;
            }
        }
        if (!salesPayload.detail[0].akunId) {
            // Fallback: try to find any account to avoid 400
            // Just log warn
            log.info('Warning: Could not find Sales Account (4101). Transaction might fail.');
        }
        const resSale = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(salesPayload)
        });
        if (!resSale.ok) {
            const err = await resSale.json();
            log.info(`Create Sales Failed: ${err.error ? err.error.message : JSON.stringify(err)}`);
        }
        else {
            const saleRes = await resSale.json();
            log.pass(`Created Sales: ${saleRes.data ? saleRes.data.nomorTransaksi : 'Unknown Ref'}`);
        }
        return true;
    }
    catch (error) {
        log.fail(error.message);
        return false;
    }
}
async function testReports() {
    log.section('REPORTS');
    try {
        const resBS = await fetch(`${BASE_URL}/reports/balance-sheet`, { headers: HEADERS });
        if (resBS.ok)
            log.pass('Balance Sheet Retrieved');
        else
            log.fail(`Balance Sheet Failed: ${resBS.status}`);
        const resIS = await fetch(`${BASE_URL}/reports/income-statement`, { headers: HEADERS });
        if (resIS.ok)
            log.pass('Income Statement Retrieved');
        else
            log.fail(`Income Statement Failed: ${resIS.status}`);
        return true;
    }
    catch (error) {
        log.fail(error.message);
        return false;
    }
}
async function run() {
    console.log(`🚀 Starting System Test at ${new Date().toISOString()}`);
    if (!await testAuth())
        return;
    await testMasterData();
    await testTransactions();
    await testReports();
    console.log('\n🏁 System Test Completed');
}
run();
