"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
    });
};
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (env_1.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
exports.default = prisma;
