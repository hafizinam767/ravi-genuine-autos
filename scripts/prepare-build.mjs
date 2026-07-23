import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const env = { ...process.env }
const fallbackDatabaseUrl = 'file:./db/custom.db'

if (!env.DATABASE_URL) {
  env.DATABASE_URL = fallbackDatabaseUrl
  console.log(`Using fallback SQLite DATABASE_URL for build: ${fallbackDatabaseUrl}`)
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env,
    shell: true,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function copyDirectory(source, destination) {
  if (!existsSync(source)) {
    return
  }

  mkdirSync(destination, { recursive: true })
  cpSync(source, destination, { recursive: true })
}

run('npx', ['prisma', 'generate'])
run('npx', ['next', 'build'])

mkdirSync(path.join(rootDir, '.next', 'standalone'), { recursive: true })
copyDirectory(path.join(rootDir, '.next', 'static'), path.join(rootDir, '.next', 'standalone', '.next', 'static'))
copyDirectory(path.join(rootDir, 'public'), path.join(rootDir, '.next', 'standalone', 'public'))
copyDirectory(path.join(rootDir, 'db'), path.join(rootDir, '.next', 'standalone', 'db'))
