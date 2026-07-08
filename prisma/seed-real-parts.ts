/**
 * Seed script to add REAL parts data from uploaded price lists.
 * Source: Price Lists+Part numbers.rar (uploaded by user)
 *
 * Adds:
 *  - New car models (Toyota Yaris, Hilux, Fortuner, Hiace, Rush, Corolla Cross; MG ZS EV, MG4 EV, MG5 EV; CHANGAN Alsvin, Oshan X7, Karvaan; Honda BR-V, HR-V, CR-V, Accord; Hyundai Elantra, Sonata, Staria; Daihatsu Mira, Move, Boon; Suzuki Swift, Jimny)
 *  - 103 real Toyota parts from Genesis price list (with real part numbers & PKR prices)
 *  - 200 real MG parts from MG Aftersales price list (with real part numbers & PKR prices)
 *  - 7 Suzuki fast-moving parts WITH brochures (oil filter, AC filter, brake fluid, brake pad, drive belt, spark plug, ATF)
 *  - 18 CHANGAN parts (Alsvin, Oshan X7, Karvaan)
 *
 * Usage: bunx tsx prisma/seed-real-parts.ts
 */
import { db } from '../src/lib/db'
import { realPartsData } from './real-parts-data'

// ─── New car models to add (slugs must match those used in real-parts-data.ts) ───

interface NewCarModel {
  name: string
  make: string
  slug: string
  image: string | null
}

const newCarModels: NewCarModel[] = [
  // Toyota
  { name: 'Yaris', make: 'Toyota', slug: 'toyota-yaris', image: null },
  { name: 'Hilux', make: 'Toyota', slug: 'toyota-hilux', image: null },
  { name: 'Fortuner', make: 'Toyota', slug: 'toyota-fortuner', image: null },
  { name: 'Hiace', make: 'Toyota', slug: 'toyota-hiace', image: null },
  { name: 'Rush', make: 'Toyota', slug: 'toyota-rush', image: null },
  { name: 'Corolla Cross', make: 'Toyota', slug: 'toyota-corolla-cross', image: null },
  // MG (EV variants)
  { name: 'ZS EV', make: 'MG', slug: 'mg-zs-ev', image: null },
  { name: 'MG4 EV', make: 'MG', slug: 'mg-4-ev', image: null },
  { name: 'MG5 EV', make: 'MG', slug: 'mg-5-ev', image: null },
  // CHANGAN
  { name: 'Alsvin', make: 'CHANGAN', slug: 'changan-alsvin', image: null },
  { name: 'Oshan X7', make: 'CHANGAN', slug: 'changan-oshan-x7', image: null },
  { name: 'Karvaan', make: 'CHANGAN', slug: 'changan-karvaan', image: null },
  // Honda additional
  { name: 'BR-V', make: 'Honda', slug: 'honda-br-v', image: null },
  { name: 'HR-V', make: 'Honda', slug: 'honda-hr-v', image: null },
  { name: 'CR-V', make: 'Honda', slug: 'honda-cr-v', image: null },
  { name: 'Accord', make: 'Honda', slug: 'honda-accord', image: null },
  // Hyundai additional
  { name: 'Elantra', make: 'Hyundai', slug: 'hyundai-elantra', image: null },
  { name: 'Sonata', make: 'Hyundai', slug: 'hyundai-sonata', image: null },
  { name: 'Staria', make: 'Hyundai', slug: 'hyundai-staria', image: null },
  // Daihatsu additional
  { name: 'Mira', make: 'Daihatsu', slug: 'daihatsu-mira', image: null },
  { name: 'Move', make: 'Daihatsu', slug: 'daihatsu-move', image: null },
  { name: 'Boon', make: 'Daihatsu', slug: 'daihatsu-boon', image: null },
  // Suzuki additional
  { name: 'Swift', make: 'Suzuki', slug: 'suzuki-swift', image: null },
  { name: 'Jimny', make: 'Suzuki', slug: 'suzuki-jimny', image: null },
]

async function main() {
  console.log('🌱 Adding REAL parts data from uploaded price lists...')

  // ─── 1. Add new car models (skip if already exists) ────────────────
  console.log('🚗 Adding new car models...')
  let addedModels = 0
  for (const cm of newCarModels) {
    const existing = await db.carModel.findUnique({ where: { slug: cm.slug } })
    if (existing) continue
    await db.carModel.create({ data: { name: cm.name, make: cm.make, slug: cm.slug, image: cm.image } })
    addedModels++
  }
  console.log(`✅ Added ${addedModels} new car models.`)

  // ─── 2. Fetch all categories and car models by slug ─────────────────
  const allCategories = await db.category.findMany()
  const allCarModels = await db.carModel.findMany()
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]))
  const carModelBySlug = new Map(allCarModels.map((c) => [c.slug, c]))

  // ─── 3. Insert real parts (skip duplicates by slug) ─────────────────
  console.log(`📦 Inserting ${realPartsData.length} real parts...`)
  let added = 0
  let skipped = 0
  let missingCat = 0
  let missingModel = 0

  for (const part of realPartsData) {
    // Skip if already exists (by slug or partNumber)
    const existing = await db.product.findUnique({ where: { slug: part.slug } })
    if (existing) {
      skipped++
      continue
    }
    if (part.partNumber) {
      const existingByPart = await db.product.findFirst({ where: { partNumber: part.partNumber } })
      if (existingByPart) {
        skipped++
        continue
      }
    }

    const category = categoryBySlug.get(part.categoryId)
    const carModel = carModelBySlug.get(part.carModelId)

    if (!category) {
      console.warn(`  ⚠️  Category not found: ${part.categoryId} (for ${part.name})`)
      missingCat++
      continue
    }
    if (!carModel) {
      console.warn(`  ⚠️  Car model not found: ${part.carModelId} (for ${part.name})`)
      missingModel++
      continue
    }

    await db.product.create({
      data: {
        name: part.name,
        slug: part.slug,
        description: part.description,
        price: part.price,
        condition: part.condition,
        stock: part.stock,
        images: part.images,
        sku: part.sku,
        partNumber: part.partNumber,
        brochure: part.brochure || null,
        categoryId: category.id,
        carModelId: carModel.id,
        featured: part.featured,
      },
    })
    added++
  }

  console.log(`✅ Inserted ${added} new real parts.`)
  console.log(`   Skipped (already existed): ${skipped}`)
  console.log(`   Missing category: ${missingCat}`)
  console.log(`   Missing car model: ${missingModel}`)

  // ─── 4. Summary ────────────────────────────────────────────────────
  const totalProducts = await db.product.count()
  const totalModels = await db.carModel.count()
  console.log('\n🎉 Real parts seed completed!')
  console.log('─────────────────────────────────────')
  console.log(`  Total Car Models:  ${totalModels}`)
  console.log(`  Total Products:    ${totalProducts}`)
  console.log('─────────────────────────────────────')

  await db.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
