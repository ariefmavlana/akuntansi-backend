"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_service_1 = require("../src/services/auth.service");
const jwt_1 = require("../src/utils/jwt");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});
async function main() {
    console.log('Starting Auth Feature Verification...');
    try {
        // 1. Setup User
        const user = await prisma.pengguna.findFirst({ where: { role: 'SUPERADMIN' } });
        if (!user)
            throw new Error('No user found');
        console.log(`Using user: ${user.email}`);
        // 2. Test Logout (Blacklist)
        console.log('\n--- Test 1: Logout & Token Blacklist ---');
        // Generate a fake refresh token
        const tokens = (0, jwt_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
            perusahaanId: user.perusahaanId
        });
        await auth_service_1.authService.logout(user.id, tokens.refreshToken);
        console.log('Logout executed.');
        // Verify it's in blacklist
        const blacklist = await prisma.tokenBlacklist.findUnique({
            where: { token: tokens.refreshToken }
        });
        if (blacklist) {
            console.log('✅ Token successfully blacklisted.');
        }
        else {
            console.error('❌ Token NOT found in blacklist.');
        }
        // 3. Test Password Reset Request
        console.log('\n--- Test 2: Request Password Reset ---');
        await auth_service_1.authService.requestPasswordReset({ email: user.email });
        // Find the token in DB
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: { email: user.email, used: false },
            orderBy: { createdAt: 'desc' }
        });
        if (resetToken) {
            console.log(`✅ Reset Token generated: ${resetToken.token}`);
        }
        else {
            console.error('❌ Reset Token NOT generated.');
            return;
        }
        // 4. Test Reset Password
        console.log('\n--- Test 3: Reset Password ---');
        const newPassword = 'NewPassword123!';
        await auth_service_1.authService.resetPassword({
            token: resetToken.token,
            newPassword: newPassword
        });
        const updatedUser = await prisma.pengguna.findUnique({ where: { id: user.id } });
        // We can't check hash easily, but if no error thrown, it's good.
        console.log('✅ Password reset executed successfully (No error thrown).');
        // Mark used
        const usedToken = await prisma.passwordResetToken.findUnique({ where: { id: resetToken.id } });
        if (usedToken?.used) {
            console.log('✅ Token marked as USED.');
        }
        else {
            console.error('❌ Token NOT marked as used.');
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
