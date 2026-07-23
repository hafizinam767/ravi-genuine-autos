// @ts-ignore
import { Database } from 'bun:sqlite';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const localDbPath = './db/custom.db';
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
  }

  console.log(`🔌 Opening local database: ${localDbPath}`);
  const localDb = new Database(localDbPath);

  console.log(`🔌 Connecting to Turso database: ${tursoUrl}`);
  const remoteDb = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  // Get all user tables (exclude sqlite system tables)
  const tables = localDb
    .query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    .all() as { name: string; sql: string }[];

  // Get all indexes
  const indexes = localDb
    .query("SELECT name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL;")
    .all() as { name: string; sql: string }[];

  console.log(`Found ${tables.length} tables and ${indexes.length} indexes in local database.`);

  // Step 1: Drop foreign key checks if possible, or just drop tables in reverse order or cascade
  console.log('🧹 Dropping existing tables on Turso if they exist...');
  // Disable foreign keys temporarily for clean recreation
  try {
    await remoteDb.execute('PRAGMA foreign_keys = OFF;');
  } catch (e) {
    // Some drivers might not support PRAGMA or fail silently
  }

  // To drop tables, let's just get the remote tables list and drop them
  const remoteTablesRes = await remoteDb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  for (const row of remoteTablesRes.rows) {
    const tableName = row.name as string;
    console.log(`  Dropping table: ${tableName}`);
    await remoteDb.execute(`DROP TABLE IF EXISTS "${tableName}";`);
  }

  // Step 2: Create tables
  console.log('🏗️ Creating tables on Turso...');
  for (const table of tables) {
    console.log(`  Creating table: ${table.name}`);
    await remoteDb.execute(table.sql);
  }

  // Step 3: Create indexes
  console.log('🏗️ Creating indexes on Turso...');
  for (const index of indexes) {
    console.log(`  Creating index: ${index.name}`);
    await remoteDb.execute(index.sql);
  }

  // Step 4: Copy data
  console.log('🚚 Copying data from local SQLite to Turso...');
  for (const table of tables) {
    const tableName = table.name;
    const rows = localDb.query(`SELECT * FROM "${tableName}";`).all() as Record<string, any>[];
    
    if (rows.length === 0) {
      console.log(`  Table "${tableName}" is empty. Skipping.`);
      continue;
    }

    console.log(`  Copying ${rows.length} rows for table: ${tableName}`);

    // Let's get column names
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders});`;

    // Process in batches of 50 to avoid payload size limits on remote requests
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      // We can use a transaction or execute multiple statements
      const statements = batch.map(row => {
        const args = columns.map(col => {
          const val = row[col];
          // Handle Date or boolean/objects conversion if SQLite/LibSQL requires it
          if (val instanceof Date) {
            return val.toISOString();
          }
          return val;
        });
        return {
          sql: insertSql,
          args,
        };
      });

      await remoteDb.batch(statements, 'write');
    }
  }

  // Enable foreign keys again
  try {
    await remoteDb.execute('PRAGMA foreign_keys = ON;');
  } catch (e) {}

  console.log('🎉 Successfully synchronized local SQLite schema and data to Turso database!');
  localDb.close();
}

main().catch(console.error);
