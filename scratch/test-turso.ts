import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  console.log('Credentials:', { tursoUrl, tursoTokenExists: !!tursoToken });

  const config = {
    url: tursoUrl!,
    authToken: tursoToken,
  };

  const adapter = new PrismaLibSql(config);
  const prisma = new PrismaClient({ adapter });

  console.log('Fetching categories...');
  const categories = await prisma.category.findMany();
  console.log('Categories:', categories);
}

main().catch(console.error);
