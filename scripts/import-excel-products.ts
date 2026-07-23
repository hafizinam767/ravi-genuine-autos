import { db } from '../src/lib/db';

const EXCEL_PRODUCTS = [
  // Group 1: Engine Oils
  {
    partNumber: '99EA3B10W40PSN2',
    name: 'ECSTAR F7000 SN 10W40 2.7L',
    price: 5630.96,
    description: 'Genuine Suzuki ECSTAR F7000 Premium Engine Oil SN 10W40 2.7L',
  },
  {
    partNumber: '99EA3B10W40PSN3',
    name: 'ECSTAR F7000 SN 10W40 3.0L',
    price: 6213.88,
    description: 'Genuine Suzuki ECSTAR F7000 Premium Engine Oil SN 10W40 3.0L',
  },
  {
    partNumber: '99EA3B10W40PSN4',
    name: 'ECSTAR F7000 SN 10W40 4.0L',
    price: 7993.32,
    description: 'Genuine Suzuki ECSTAR F7000 Premium Engine Oil SN 10W40 4.0L',
  },
  {
    partNumber: '99EA3B05W30PSN3',
    name: 'ECSTAR F7000 SN 5W30 3.0L',
    price: 7228.68,
    description: 'Genuine Suzuki ECSTAR F7000 Synthetic Engine Oil SN 5W30 3.0L',
  },
  {
    partNumber: '99EA3B05W30PSN4',
    name: 'ECSTAR F7000 SN 5W30 4.0L',
    price: 9255.92,
    description: 'Genuine Suzuki ECSTAR F7000 Synthetic Engine Oil SN 5W30 4.0L',
  },
  {
    partNumber: '99EA3B00W20PSP1',
    name: 'ECSTAR F9000 SP 0W20 3.1L',
    price: 7953.2,
    description: 'Genuine Suzuki ECSTAR F9000 Fully Synthetic Engine Oil SP 0W20 3.1L',
  },
  {
    partNumber: '99EA3B00W20PSP4',
    name: 'ECSTAR F9000 SP 0W20 4.0L',
    price: 10168.06,
    description: 'Genuine Suzuki ECSTAR F9000 Fully Synthetic Engine Oil SP 0W20 4.0L',
  },

  // Group 2: Gear Oil & Transmission
  {
    partNumber: '99000B22932P000',
    name: 'ECSTAR GEAR OIL 90 1L',
    price: 1084.42,
    description: 'Genuine Suzuki ECSTAR Gear Oil 90 Grade 1L',
  },
  {
    partNumber: '99000B22B27P036',
    name: 'ECSTAR GEAR OIL 75W 1L',
    price: 23268.26,
    description: 'Genuine Suzuki ECSTAR High Performance Transmission Gear Oil 75W 1L',
  },
  {
    partNumber: '99000B22910P000',
    name: 'ECSTAR GEAR OIL 75W90 1L',
    price: 1925.76,
    description: 'Genuine Suzuki ECSTAR Transmission Gear Oil 75W90 1L',
  },
  {
    partNumber: '99000-22B00-000',
    name: 'SUZUKI ATF (3317/3309) 1L',
    price: 6036.88,
    description: 'Genuine Suzuki Automatic Transmission Fluid ATF (3317/3309) 1L',
  },
  {
    partNumber: '99000-22B28-017',
    name: 'SUZUKI AT-OIL AW-1 1L (AVB/APK)',
    price: 7149.62,
    description: 'Genuine Suzuki Automatic Transmission Oil AW-1 1L (AVB/APK)',
  },
  {
    partNumber: '99000-22B63-046',
    name: 'CVT FLUID GREEN2 4L',
    price: 20360.9,
    description: 'Genuine Suzuki CVT Transmission Fluid Green 2 4L',
  },
  {
    partNumber: '99DA1B85GL5P001',
    name: 'DIFF.OIL SAE 85W140-GL5 1L',
    price: 1237.82,
    description: 'Genuine Suzuki Differential Oil SAE 85W140 GL-5 1L',
  },
  {
    partNumber: '99BA1BSGBFPP200',
    name: 'SUZUKI BRAKE FLUID 200ML',
    price: 947.54,
    description: 'Genuine Suzuki Heavy Duty Brake Fluid 200ML',
  },

  // Group 3: Chemical & Maintenance
  {
    partNumber: '99CA1BSLLCPP301',
    name: 'ECSTAR LONG LIFE COOLANT 1 LTR',
    price: 1411.28,
    description: 'Genuine Suzuki ECSTAR Long Life Engine Coolant 1 LTR',
  },
  {
    partNumber: '99000B99BWTP000',
    name: 'BATTERY WATER 600ML',
    price: 141.6,
    description: 'Genuine Suzuki Deionized Battery Water 600ML',
  },
  {
    partNumber: '99WA1BWSWFPP000',
    name: 'SUZUKI WINDSHIELD WASHER FLUID',
    price: 649.0,
    description: 'Genuine Suzuki All-Season Windshield Washer Fluid Concentrate',
  },
];

function generateSlug(name: string, partNumber: string): string {
  return `${name}-${partNumber}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🚀 Starting import of 18 products into "Genuine Parts" category...');

  // 1. Ensure "Genuine Parts" category exists
  let genuineCategory = await db.category.findFirst({
    where: { slug: 'genuine-parts' },
  });

  if (!genuineCategory) {
    genuineCategory = await db.category.create({
      data: {
        name: 'Genuine Parts',
        slug: 'genuine-parts',
        description: 'Original OEM lubricants, fluids, chemicals, and genuine components.',
      },
    });
    console.log('✅ Created "Genuine Parts" category');
  } else {
    console.log(`✅ Found "Genuine Parts" category (ID: ${genuineCategory.id})`);
  }

  // 2. Find a default Suzuki car model for association
  const suzukiModel = await db.carModel.findFirst({
    where: { make: 'Suzuki' },
  });

  const carModelId = suzukiModel?.id || 'cmr3cc1kt000drb4n7dbhp9qk';

  let importedCount = 0;
  let updatedCount = 0;

  for (const item of EXCEL_PRODUCTS) {
    const slug = generateSlug(item.name, item.partNumber);
    const sku = `SKU-${item.partNumber}`;

    // Check existing by partNumber or slug
    const existing = await db.product.findFirst({
      where: {
        OR: [{ partNumber: item.partNumber }, { slug }],
      },
    });

    if (existing) {
      await db.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          price: item.price,
          description: item.description,
          partNumber: item.partNumber,
          categoryId: genuineCategory.id,
          carModelId: carModelId,
          stock: 50,
          condition: 'new',
        },
      });
      console.log(`🔄 Updated: [${item.partNumber}] ${item.name} - Rs. ${item.price}`);
      updatedCount++;
    } else {
      await db.product.create({
        data: {
          name: item.name,
          slug,
          description: item.description,
          price: item.price,
          partNumber: item.partNumber,
          sku,
          stock: 50,
          condition: 'new',
          featured: true,
          categoryId: genuineCategory.id,
          carModelId: carModelId,
          images: '/products/oil.jpg',
        },
      });
      console.log(`✨ Created: [${item.partNumber}] ${item.name} - Rs. ${item.price}`);
      importedCount++;
    }
  }

  console.log(`\n🎉 Import Complete! Created: ${importedCount}, Updated: ${updatedCount}, Total: 18 products.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
