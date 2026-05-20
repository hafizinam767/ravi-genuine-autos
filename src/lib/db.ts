import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if using Turso (cloud) or local SQLite
  const useTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN

  if (useTurso) {
    // Cloud database via Turso — required for Vercel/serverless
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite database (for development)
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Enable WAL mode and set busy timeout for better SQLite concurrency (local only)
if (!process.env.TURSO_DATABASE_URL) {
  db.$executeRawUnsafe(`PRAGMA journal_mode=WAL;`).catch(() => {})
  db.$executeRawUnsafe(`PRAGMA busy_timeout=5000;`).catch(() => {})
  db.$executeRawUnsafe(`PRAGMA synchronous=NORMAL;`).catch(() => {})
}
