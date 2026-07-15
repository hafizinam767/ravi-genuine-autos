import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const localUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const remoteUrl = process.env.TURSO_DATABASE_URL
  const isTurso = Boolean(remoteUrl && remoteUrl.startsWith('libsql://'))

  if (isTurso) {
    const authToken = process.env.TURSO_AUTH_TOKEN
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN is required when using a libsql database URL')
    }

    console.log('🗄️ Using Turso cloud database')

    return new PrismaClient({
      adapter: new PrismaLibSQL({
        url: remoteUrl!,
        authToken,
      }),
    })
  }

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

// Enable WAL mode and set busy timeout for better SQLite concurrency
// This keeps the local SQLite deployment simple and portable.
db.$executeRawUnsafe(`PRAGMA journal_mode=WAL;`).catch(() => {})
db.$executeRawUnsafe(`PRAGMA busy_timeout=5000;`).catch(() => {})
db.$executeRawUnsafe(`PRAGMA synchronous=NORMAL;`).catch(() => {})
