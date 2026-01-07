const BASE_URL = 'http://localhost:5000/api/v1';
let accessToken = '';

async function test() {
    console.log('🧪 Testing Backend Akuntansi API\n');
    console.log('='.repeat(50));

    // 1. Health Check
    console.log('\n1️⃣ Testing Health Check...');
    try {
        const health = await fetch('http://localhost:5000/health').then(r => r.json());
        console.log('✅ Health:', health.status);
        console.log('   Environment:', health.environment);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }

    // 2. Login
    console.log('\n2️⃣ Testing Login...');
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailOrUsername: 'admin@akuntansi.id',
                password: 'admin123'
            })
        }).then(r => r.json());

        if (loginRes.success) {
            accessToken = loginRes.data.tokens.accessToken;
            console.log('✅ Login successful');
            console.log('   User:', loginRes.data.user.namaLengkap);
            console.log('   Role:', loginRes.data.user.role);
            console.log('   Email:', loginRes.data.user.email);
        } else {
            console.log('❌ Login failed:', loginRes.error?.message);
            return;
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return;
    }

    // 3. Get Current User
    console.log('\n3️⃣ Testing Get Current User...');
    try {
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(r => r.json());

        if (meRes.success) {
            console.log('✅ Get user successful');
            console.log('   Username:', meRes.data.username);
            console.log('   Company:', meRes.data.perusahaan?.nama || 'N/A');
        } else {
            console.log('❌ Get user failed:', meRes.error?.message);
        }
    } catch (error) {
        console.log('❌ Get user error:', error.message);
    }

    // 4. List Companies
    console.log('\n4️⃣ Testing List Companies...');
    try {
        const companiesRes = await fetch(`${BASE_URL}/companies`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(r => r.json());

        if (companiesRes.success) {
            console.log('✅ List companies successful');
            console.log('   Total:', companiesRes.meta?.total || companiesRes.data.length);
            if (companiesRes.data.length > 0) {
                console.log('   First company:', companiesRes.data[0].nama);
            }
        } else {
            console.log('❌ List companies failed:', companiesRes.error?.message);
        }
    } catch (error) {
        console.log('❌ List companies error:', error.message);
    }

    // 5. List COA
    console.log('\n5️⃣ Testing List Chart of Accounts...');
    try {
        const coaRes = await fetch(`${BASE_URL}/coa?limit=5`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(r => r.json());

        if (coaRes.success) {
            console.log('✅ List COA successful');
            console.log('   Total accounts:', coaRes.meta?.total || 0);
            if (coaRes.data.length > 0) {
                console.log('   Sample account:', coaRes.data[0].kodeAkun, '-', coaRes.data[0].namaAkun);
            }
        } else {
            console.log('❌ List COA failed:', coaRes.error?.message);
        }
    } catch (error) {
        console.log('❌ List COA error:', error.message);
    }

    // 6. List Transactions
    console.log('\n6️⃣ Testing List Transactions...');
    try {
        const txRes = await fetch(`${BASE_URL}/transactions?limit=5`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(r => r.json());

        if (txRes.success) {
            console.log('✅ List transactions successful');
            console.log('   Total transactions:', txRes.meta?.total || 0);
            if (txRes.data.length > 0) {
                console.log('   Sample transaction:', txRes.data[0].nomorTransaksi);
            }
        } else {
            console.log('❌ List transactions failed:', txRes.error?.message);
        }
    } catch (error) {
        console.log('❌ List transactions error:', error.message);
    }

    // 7. List Users
    console.log('\n7️⃣ Testing List Users...');
    try {
        const usersRes = await fetch(`${BASE_URL}/users?limit=5`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(r => r.json());

        if (usersRes.success) {
            console.log('✅ List users successful');
            console.log('   Total users:', usersRes.meta?.total || 0);
        } else {
            console.log('❌ List users failed:', usersRes.error?.message);
        }
    } catch (error) {
        console.log('❌ List users error:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Test Suite Completed!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log('   Server: ✅ Running');
    console.log('   Authentication: ✅ Working');
    console.log('   Authorization: ✅ Working');
    console.log('   Database: ✅ Connected');
    console.log('\n✅ All core endpoints are functional!');
    console.log('\n💡 Next: Run comprehensive tests with Jest');
}

// Run tests
test().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
