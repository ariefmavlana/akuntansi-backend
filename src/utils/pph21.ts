/**
 * PPh 21 Calculation Utilities
 * Based on Indonesian Tax Regulations (UU HPP / TER 2024 for monthly, but using standard annualized usually for accuracy)
 * Simplification: Using standard annualized mechanism for this system.
 */

interface PPh21Result {
    biayaJabatan: number;
    ptkp: number;
    pkp: number;
    pph21Tahunan: number;
    pph21Bulanan: number;
}

export class PPh21Utils {
    // PTKP Rates (2024)
    private static readonly PTKP_RATES: Record<string, number> = {
        'TK/0': 54000000,
        'TK/1': 58500000,
        'TK/2': 63000000,
        'TK/3': 67500000,
        'K/0': 58500000,
        'K/1': 63000000,
        'K/2': 67500000,
        'K/3': 72000000,
        // Add others if needed
    };

    /**
     * Calculate PPh 21
     * @param grossIncome Monthly gross income (Gaji + Tunjangan + Lainnya)
     * @param info Employee tax info
     */
    static calculate(
        grossIncome: number,
        info: { statusPtkp: string; hasNpwp: boolean }
    ): PPh21Result {
        // 1. Biaya Jabatan (5% of Gross, Max 500k/mo or 6jt/year)
        let biayaJabatan = grossIncome * 0.05;
        if (biayaJabatan > 500000) biayaJabatan = 500000;

        // 2. Net Income (Monthly)
        // Assumption: No JHT/JP deductions included in calculation yet for simplicity
        // Ideally subtract BPJS Ketenagakerjaan (paid by employee) here. 
        // We will neglect BPJS employee part reduction for PKP for now unless explicitly asked.
        const netIncomeMonthly = grossIncome - biayaJabatan;
        const netIncomeYearly = netIncomeMonthly * 12;

        // 3. PTKP
        const ptkp = this.PTKP_RATES[info.statusPtkp] || this.PTKP_RATES['TK/0'];

        // 4. PKP (Penghasilan Kena Pajak)
        let pkp = netIncomeYearly - ptkp;
        // Round down to thousands
        pkp = Math.floor(pkp / 1000) * 1000;

        if (pkp <= 0) {
            return {
                biayaJabatan,
                ptkp,
                pkp: 0,
                pph21Tahunan: 0,
                pph21Bulanan: 0
            };
        }

        // 5. Calculate Tax (Progressive Rates 2024 - UU HPP)
        // Layer 1: 0 - 60jt : 5%
        // Layer 2: 60jt - 250jt : 15%
        // Layer 3: 250jt - 500jt : 25%
        // Layer 4: 500jt - 5M : 30%
        // Layer 5: > 5M : 35%

        let tax = 0;
        let remainingPkp = pkp;

        // Layer 1
        if (remainingPkp > 0) {
            const taxable = Math.min(remainingPkp, 60000000);
            tax += taxable * 0.05;
            remainingPkp -= taxable;
        }

        // Layer 2
        if (remainingPkp > 0) {
            const taxable = Math.min(remainingPkp, 190000000); // 250 - 60
            tax += taxable * 0.15;
            remainingPkp -= taxable;
        }

        // Layer 3
        if (remainingPkp > 0) {
            const taxable = Math.min(remainingPkp, 250000000); // 500 - 250
            tax += taxable * 0.25;
            remainingPkp -= taxable;
        }

        // Layer 4
        if (remainingPkp > 0) {
            const taxable = Math.min(remainingPkp, 4500000000); // 5M - 500
            tax += taxable * 0.30;
            remainingPkp -= taxable;
        }

        // Layer 5
        if (remainingPkp > 0) {
            tax += remainingPkp * 0.35;
        }

        // Penalty for no NPWP (usually 20% higher)
        // if (!info.hasNpwp) tax = tax * 1.2; 
        // Disabled for now as we don't strictly track NPWP validity in this simplistic model

        return {
            biayaJabatan,
            ptkp,
            pkp,
            pph21Tahunan: tax,
            pph21Bulanan: tax / 12
        };
    }
}
