import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const localUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

  // Use Turso cloud database if BOTH URL and Token are properly set and valid
  if (
    tursoUrl &&
    tursoToken &&
    tursoUrl !== 'undefined' &&
    tursoToken !== 'undefined' &&
    tursoUrl.startsWith('libsql://')
  ) {
    try {
      const libsql = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      })
      const adapter = new PrismaLibSQL(libsql)
      console.log('🗄️ Using Turso cloud database')
      return new PrismaClient({ adapter })
    } catch (error) {
      console.warn('⚠️ Failed to connect to Turso, falling back to local database:', error)
    }
  }

  // Fallback: Local SQLite database (for development or build time)
  console.log('🗄️ Using local SQLite database')
  return new PrismaClient({
    datasources: {
      db: {
        url: localUrl,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Enable WAL mode and set busy timeout for better SQLite concurrency (local only)
const tursoUrl = process.env.TURSO_DATABASE_URL
if (!tursoUrl || tursoUrl === 'undefined') {
  db.$executeRawUnsafe(`PRAGMA journal_mode=WAL;`).catch(() => {})
  db.$executeRawUnsafe(`PRAGMA busy_timeout=5000;`).catch(() => {})
  db.$executeRawUnsafe(`PRAGMA synchronous=NORMAL;`).catch(() => {})
}
