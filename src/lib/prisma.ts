import { PrismaClient } from '@prisma/client'

/**
 * Inisialisasi PrismaClient sebagai singleton.
 *
 * Di lingkungan development Next.js, hot-reload bisa menyebabkan
 * beberapa instance PrismaClient dibuat yang menimbulkan masalah koneksi.
 * Untuk mencegahnya, instance disimpan pada `globalThis.prismaGlobal`.
 */
const prismaClientSingleton = () => {
  return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// Gunakan instance global jika tersedia (development), jika tidak buat baru
const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

// Hanya simpan pada global di non-production untuk mencegah multiple clients
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
