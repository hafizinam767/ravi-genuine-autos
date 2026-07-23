const { db } = require('../src/lib/db');

async function getPopularCarIds() {
  const models = await db.carModel.findMany({
    where: {
      OR: [
        { name: { contains: 'alto' } },
        { name: { contains: 'civic' } },
        { name: { contains: 'altis' } },
        { name: { contains: 'corolla' } },
        { name: { contains: 'mg' } },
        { name: { contains: 'hs' } }
      ]
    }
  });
  console.log('Matching Car Models:', JSON.stringify(models, null, 2));
}

getPopularCarIds().catch(console.error);
