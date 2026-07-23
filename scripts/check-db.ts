import { db } from '../src/lib/db';

async function main() {
  const categories = await db.category.findMany();
  console.log('Categories:', categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })));

  const carModels = await db.carModel.findMany();
  console.log('Car Models:', carModels.map((m) => ({ id: m.id, make: m.make, name: m.name, slug: m.slug })));
}

main().catch(console.error).finally(() => process.exit(0));
