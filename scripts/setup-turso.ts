/**
 * Turso Database Setup Script
 *
 * This script creates the database tables and seeds them with data
 * on your Turso cloud database. Run this AFTER creating your Turso database.
 *
 * Usage:
 *   TURSO_DATABASE_URL="libsql://your-db.turso.so" \
 *   TURSO_AUTH_TOKEN="your-token" \
 *   npx tsx scripts/setup-turso.ts
 */

import { createClient } from '@libsql/client'

// ─── SQL for creating tables ─────────────────────────────────────────

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CarModel (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  condition TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT NOT NULL,
  sku TEXT,
  partNumber TEXT,
  categoryId TEXT NOT NULL,
  carModelId TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (carModelId) REFERENCES CarModel(id)
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  address TEXT,
  city TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY,
  userId TEXT,
  userName TEXT NOT NULL,
  userPhone TEXT NOT NULL,
  userAddress TEXT,
  userCity TEXT,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS OrderItem (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (orderId) REFERENCES "Order"(id),
  FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE IF NOT EXISTS Wishlist (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (productId) REFERENCES Product(id),
  UNIQUE(userId, productId)
);
`

// ─── CUID generator (simple) ────────────────────────────────────────

function cuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `c${timestamp}${random}`
}

function isoNow(): string {
  return new Date().toISOString()
}

// ─── Main setup function ─────────────────────────────────────────────

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (!url || !token) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables')
    console.error('')
    console.error('Usage:')
    console.error('  TURSO_DATABASE_URL="libsql://your-db.turso.so" \\')
    console.error('  TURSO_AUTH_TOKEN="your-token" \\')
    console.error('  npx tsx scripts/setup-turso.ts')
    process.exit(1)
  }

  console.log('🔌 Connecting to Turso database...')
  const client = createClient({ url, authToken: token })

  // ── 1. Create tables ────────────────────────────────────────────────
  console.log('📁 Creating tables...')
  const statements = CREATE_TABLES_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
    } catch (err: any) {
      // Ignore "already exists" errors
      if (!err?.message?.includes('already exists')) {
        console.error(`  ⚠️  Error: ${err?.message}`)
      }
    }
  }
  console.log('✅ Tables created.')

  // ── 2. Clear existing data ──────────────────────────────────────────
  console.log('🗑️  Clearing existing data...')
  await client.execute('DELETE FROM Wishlist')
  await client.execute('DELETE FROM OrderItem')
  await client.execute('DELETE FROM "Order"')
  await client.execute('DELETE FROM Product')
  await client.execute('DELETE FROM User')
  await client.execute('DELETE FROM CarModel')
  await client.execute('DELETE FROM Category')
  console.log('✅ Existing data cleared.')

  // ── 3. Seed Categories ──────────────────────────────────────────────
  console.log('📁 Seeding categories...')
  const categories = [
    { id: cuid(), name: 'Engine Parts', slug: 'engine-parts', icon: 'Wrench', description: 'Engine components including oil, spark plugs, filters, belts, and gaskets for all major Pakistani car brands.' },
    { id: cuid(), name: 'Body Parts', slug: 'body-parts', icon: 'Car', description: 'Exterior body parts including bumpers, fenders, doors, hoods, and side mirrors for all vehicle models.' },
    { id: cuid(), name: 'Interior Parts', slug: 'interior-parts', icon: 'Armchair', description: 'Interior components including seats, dashboard, steering wheels, and floor mats to keep your cabin comfortable.' },
    { id: cuid(), name: 'Electrical Parts', slug: 'electrical-parts', icon: 'Zap', description: 'Electrical system components including batteries, alternators, starters, lights, and sensors.' },
    { id: cuid(), name: 'Suspension Parts', slug: 'suspension-parts', icon: 'ArrowDownUp', description: 'Suspension system parts including shock absorbers, springs, control arms, and bushings for a smooth ride.' },
    { id: cuid(), name: 'Brake Parts', slug: 'brake-parts', icon: 'Disc', description: 'Braking system components including brake pads, rotors, calipers, and brake lines for safety.' },
    { id: cuid(), name: 'Transmission Parts', slug: 'transmission-parts', icon: 'Cog', description: 'Transmission and drivetrain parts including clutch kits, gearboxes, axles, and CV joints.' },
    { id: cuid(), name: 'AC & Cooling', slug: 'ac-cooling', icon: 'Thermometer', description: 'Air conditioning and cooling system parts including compressors, condensers, radiators, and thermostats.' },
  ]

  for (const cat of categories) {
    await client.execute({
      sql: 'INSERT INTO Category (id, name, slug, icon, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      args: [cat.id, cat.name, cat.slug, cat.icon, cat.description, isoNow()],
    })
  }
  console.log(`✅ Created ${categories.length} categories.`)

  // ── 4. Seed Car Models ──────────────────────────────────────────────
  console.log('🚗 Seeding car models...')
  const carModels = [
    { id: cuid(), name: 'WagonR', make: 'Suzuki', slug: 'suzuki-wagonr', image: '/cars/wagonr.png' },
    { id: cuid(), name: 'Alto', make: 'Suzuki', slug: 'suzuki-alto', image: '/cars/alto.png' },
    { id: cuid(), name: 'Mehran', make: 'Suzuki', slug: 'suzuki-mehran', image: '/cars/mehran.png' },
    { id: cuid(), name: 'Cultus', make: 'Suzuki', slug: 'suzuki-cultus', image: '/cars/cultus.png' },
    { id: cuid(), name: 'Corolla XLI', make: 'Toyota', slug: 'toyota-corolla-xli', image: '/cars/corolla.png' },
    { id: cuid(), name: 'Corolla GLI', make: 'Toyota', slug: 'toyota-corolla-gli', image: '/cars/corolla.png' },
    { id: cuid(), name: 'City', make: 'Honda', slug: 'honda-city', image: '/cars/city.png' },
    { id: cuid(), name: 'Civic', make: 'Honda', slug: 'honda-civic', image: '/cars/civic.png' },
    { id: cuid(), name: 'Coure', make: 'Daihatsu', slug: 'daihatsu-coure', image: '/cars/coure.png' },
    { id: cuid(), name: 'Tucson', make: 'Hyundai', slug: 'hyundai-tucson', image: '/cars/tucson.png' },
    { id: cuid(), name: 'HS', make: 'MG', slug: 'mg-hs', image: '/cars/hs.png' },
    { id: cuid(), name: 'ZS', make: 'MG', slug: 'mg-zs', image: '/cars/zs.png' },
  ]

  for (const car of carModels) {
    await client.execute({
      sql: 'INSERT INTO CarModel (id, name, make, slug, image, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      args: [car.id, car.name, car.make, car.slug, car.image, isoNow()],
    })
  }
  console.log(`✅ Created ${carModels.length} car models.`)

  // ── 5. Seed Products ────────────────────────────────────────────────
  console.log('📦 Seeding products...')

  const [engineParts, bodyParts, interiorParts, electricalParts, suspensionParts, brakeParts, transmissionParts, acCooling] = categories
  const [wagonR, alto, mehran, cultus, corollaXli, corollaGli, city, civic, coure, tucson, mgHs, mgZs] = carModels

  const products = [
    // Engine Parts
    { name: 'Shell Helix HX5 10W-40 Engine Oil 4L', slug: 'shell-helix-hx5-10w40-engine-oil-4l', description: 'Premium quality engine oil suitable for Suzuki and Toyota vehicles. Provides excellent engine protection and cleaning performance. API SN certified for modern engines.', price: 4800, condition: 'new', stock: 45, images: '/products/engine-parts.png', sku: 'RG-OIL-001', partNumber: 'SH-HX5-10W40-4L', categoryId: engineParts.id, carModelId: corollaXli.id, featured: 1 },
    { name: 'NGK BKR5E Spark Plugs (Set of 4)', slug: 'ngk-bkr5e-spark-plugs-set-4', description: 'Original NGK spark plugs for Suzuki Alto and WagonR. Ensures smooth ignition and better fuel economy.', price: 2200, condition: 'new', stock: 60, images: '/products/engine-parts.png', sku: 'RG-SPK-002', partNumber: 'NGK-BKR5E', categoryId: engineParts.id, carModelId: alto.id, featured: 0 },
    { name: 'Suzuki Mehran Air Filter Element', slug: 'suzuki-mehran-air-filter-element', description: 'High-quality air filter for Suzuki Mehran. Filters dust and debris to protect your engine.', price: 650, condition: 'new', stock: 80, images: '/products/engine-parts.png', sku: 'RG-AFL-003', partNumber: 'SZ-MRN-AF01', categoryId: engineParts.id, carModelId: mehran.id, featured: 0 },
    { name: 'Toyota Corolla Timing Belt Kit', slug: 'toyota-corolla-timing-belt-kit', description: 'Complete timing belt kit for Toyota Corolla XLI/GLI 1.3L. Includes timing belt, tensioner pulley, and idler pulley.', price: 8500, condition: 'new', stock: 20, images: '/products/engine-parts.png', sku: 'RG-TBK-004', partNumber: 'TY-CRL-TBKIT', categoryId: engineParts.id, carModelId: corollaXli.id, featured: 1 },
    { name: 'Honda City Cylinder Head Gasket', slug: 'honda-city-cylinder-head-gasket', description: 'OEM replacement cylinder head gasket for Honda City 1.5L. Made from high-quality multi-layer steel.', price: 4500, condition: 'new', stock: 15, images: '/products/engine-parts.png', sku: 'RG-GSK-005', partNumber: 'HN-CTY-HG01', categoryId: engineParts.id, carModelId: city.id, featured: 0 },
    { name: 'Suzuki WagonR Oil Filter', slug: 'suzuki-wagonr-oil-filter', description: 'Replacement oil filter for Suzuki WagonR K10B engine. High filtration efficiency.', price: 500, condition: 'new', stock: 100, images: '/products/engine-parts.png', sku: 'RG-OFL-006', partNumber: 'SZ-WGR-OF01', categoryId: engineParts.id, carModelId: wagonR.id, featured: 0 },
    { name: 'Honda Civic Alternator Belt (Used)', slug: 'honda-civic-alternator-belt-used', description: 'Used alternator/AC belt for Honda Civic 1.8L. Good condition with plenty of life remaining.', price: 1200, condition: 'used', stock: 8, images: '/products/engine-parts.png', sku: 'RG-BLT-007', partNumber: 'HN-CVC-ABELT', categoryId: engineParts.id, carModelId: civic.id, featured: 0 },
    { name: 'Suzuki Cultus Engine Mount (Used)', slug: 'suzuki-cultus-engine-mount-used', description: 'Used engine mount for Suzuki Cultus. Properly inspected and in good working condition.', price: 1800, condition: 'used', stock: 5, images: '/products/engine-parts.png', sku: 'RG-EMT-008', partNumber: 'SZ-CLS-EM01', categoryId: engineParts.id, carModelId: cultus.id, featured: 0 },

    // Body Parts
    { name: 'Toyota Corolla Front Bumper', slug: 'toyota-corolla-front-bumper', description: 'Brand new front bumper for Toyota Corolla XLI 2014-2021. Unpainted, ready for primer and color matching.', price: 12000, condition: 'new', stock: 10, images: '/products/body-parts.png', sku: 'RG-BMP-009', partNumber: 'TY-CRL-FB01', categoryId: bodyParts.id, carModelId: corollaXli.id, featured: 1 },
    { name: 'Suzuki Alto Left Side Mirror', slug: 'suzuki-alto-left-side-mirror', description: 'Left side mirror assembly for Suzuki Alto. Manual adjustment type.', price: 2500, condition: 'new', stock: 25, images: '/products/body-parts.png', sku: 'RG-MIR-010', partNumber: 'SZ-ALT-LM01', categoryId: bodyParts.id, carModelId: alto.id, featured: 0 },
    { name: 'Honda City Front Fender (Left)', slug: 'honda-city-front-fender-left', description: 'Front left fender for Honda City 2014-2020. Metal construction, primed and ready for paint.', price: 7500, condition: 'new', stock: 8, images: '/products/body-parts.png', sku: 'RG-FND-011', partNumber: 'HN-CTY-LF01', categoryId: bodyParts.id, carModelId: city.id, featured: 0 },
    { name: 'Suzuki Mehran Front Bumper (Used)', slug: 'suzuki-mehran-front-bumper-used', description: 'Used front bumper for Suzuki Mehran in good condition. Minor scratches but no cracks.', price: 3500, condition: 'used', stock: 6, images: '/products/body-parts.png', sku: 'RG-BMP-012', partNumber: 'SZ-MRN-FB01', categoryId: bodyParts.id, carModelId: mehran.id, featured: 0 },
    { name: 'Honda Civic Rear Bumper (Used)', slug: 'honda-civic-rear-bumper-used', description: 'Used rear bumper for Honda Civic 2016-2021. Good overall condition with minor scuffs.', price: 8000, condition: 'used', stock: 4, images: '/products/body-parts.png', sku: 'RG-BMP-013', partNumber: 'HN-CVC-RB01', categoryId: bodyParts.id, carModelId: civic.id, featured: 0 },
    { name: 'MG HS Right Side Mirror', slug: 'mg-hs-right-side-mirror', description: 'Right side power mirror for MG HS. Electric adjustment with integrated turn signal.', price: 6500, condition: 'new', stock: 12, images: '/products/body-parts.png', sku: 'RG-MIR-014', partNumber: 'MG-HS-RM01', categoryId: bodyParts.id, carModelId: mgHs.id, featured: 0 },
    { name: 'Suzuki WagonR Bonnet/Hood (Used)', slug: 'suzuki-wagonr-bonnet-hood-used', description: 'Used bonnet/hood for Suzuki WagonR. Good structural condition, no major dents.', price: 5500, condition: 'used', stock: 3, images: '/products/body-parts.png', sku: 'RG-HOD-015', partNumber: 'SZ-WGR-HD01', categoryId: bodyParts.id, carModelId: wagonR.id, featured: 0 },
    { name: 'Toyota Corolla GLI Front Door (Left, Used)', slug: 'toyota-corolla-gli-front-door-left-used', description: 'Used front left door shell for Toyota Corolla GLI. Complete with window regulator.', price: 18000, condition: 'used', stock: 2, images: '/products/body-parts.png', sku: 'RG-DOR-016', partNumber: 'TY-CGL-LD01', categoryId: bodyParts.id, carModelId: corollaGli.id, featured: 0 },

    // Interior Parts
    { name: 'Honda City Floor Mats (Full Set)', slug: 'honda-city-floor-mats-full-set', description: 'Complete set of 5 floor mats for Honda City. Heavy-duty rubber with anti-slip backing.', price: 3500, condition: 'new', stock: 30, images: '/products/interior-parts.png', sku: 'RG-INT-017', partNumber: 'HN-CTY-FM01', categoryId: interiorParts.id, carModelId: city.id, featured: 1 },
    { name: 'Toyota Corolla Steering Wheel', slug: 'toyota-corolla-steering-wheel', description: 'Replacement steering wheel for Toyota Corolla XLI/GLI. Leather-wrapped grip.', price: 9500, condition: 'new', stock: 10, images: '/products/interior-parts.png', sku: 'RG-INT-018', partNumber: 'TY-CRL-SW01', categoryId: interiorParts.id, carModelId: corollaXli.id, featured: 0 },
    { name: 'Suzuki Alto Dashboard Cover', slug: 'suzuki-alto-dashboard-cover', description: 'Dashboard cover/mat for Suzuki Alto. Protects from sun damage and reduces glare.', price: 1500, condition: 'new', stock: 20, images: '/products/interior-parts.png', sku: 'RG-INT-019', partNumber: 'SZ-ALT-DC01', categoryId: interiorParts.id, carModelId: alto.id, featured: 0 },
    { name: 'Suzuki Cultus Front Seat Cover Set', slug: 'suzuki-cultus-front-seat-cover-set', description: 'Front seat covers for Suzuki Cultus. Made from breathable fabric material.', price: 2800, condition: 'new', stock: 18, images: '/products/interior-parts.png', sku: 'RG-INT-020', partNumber: 'SZ-CLS-SC01', categoryId: interiorParts.id, carModelId: cultus.id, featured: 0 },
    { name: 'Honda Civic Dashboard Assembly (Used)', slug: 'honda-civic-dashboard-assembly-used', description: 'Used complete dashboard assembly for Honda Civic. Good condition with no cracks.', price: 25000, condition: 'used', stock: 2, images: '/products/interior-parts.png', sku: 'RG-INT-021', partNumber: 'HN-CVC-DB01', categoryId: interiorParts.id, carModelId: civic.id, featured: 0 },
    { name: 'Daihatsu Coure Floor Mats (Used)', slug: 'daihatsu-coure-floor-mats-used', description: 'Used floor mats for Daihatsu Coure. Rubber construction, decent condition.', price: 800, condition: 'used', stock: 5, images: '/products/interior-parts.png', sku: 'RG-INT-022', partNumber: 'DH-CRE-FM01', categoryId: interiorParts.id, carModelId: coure.id, featured: 0 },
    { name: 'Suzuki Mehran Steering Wheel (Used)', slug: 'suzuki-mehran-steering-wheel-used', description: 'Used steering wheel for Suzuki Mehran. Good grip condition, horn button functional.', price: 1500, condition: 'used', stock: 4, images: '/products/interior-parts.png', sku: 'RG-INT-023', partNumber: 'SZ-MRN-SW01', categoryId: interiorParts.id, carModelId: mehran.id, featured: 0 },

    // Electrical Parts
    { name: 'Osram 12V 60/55W Headlight Bulbs (Pair)', slug: 'osram-12v-headlight-bulbs-pair', description: 'Original Osram H4 headlight bulbs for all Pakistani vehicles. Bright white light for safer night driving.', price: 1800, condition: 'new', stock: 50, images: '/products/electrical-parts.png', sku: 'RG-ELC-024', partNumber: 'OS-H4-6055', categoryId: electricalParts.id, carModelId: corollaGli.id, featured: 1 },
    { name: 'AGS Battery 50Ah for Suzuki', slug: 'ags-battery-50ah-suzuki', description: 'AGS 50Ah maintenance-free battery for Suzuki Alto, Mehran, and WagonR. 1-year warranty included.', price: 9500, condition: 'new', stock: 15, images: '/products/electrical-parts.png', sku: 'RG-ELC-025', partNumber: 'AGS-50MF', categoryId: electricalParts.id, carModelId: alto.id, featured: 1 },
    { name: 'Toyota Corolla Alternator (Used)', slug: 'toyota-corolla-alternator-used', description: 'Used alternator for Toyota Corolla 1.3L. Output: 80A. Tested and in good working condition.', price: 12000, condition: 'used', stock: 5, images: '/products/electrical-parts.png', sku: 'RG-ELC-026', partNumber: 'TY-CRL-ALT01', categoryId: electricalParts.id, carModelId: corollaXli.id, featured: 0 },
    { name: 'Honda City Starter Motor (Used)', slug: 'honda-city-starter-motor-used', description: 'Used starter motor for Honda City 1.5L. Tested before removal, spins freely.', price: 8500, condition: 'used', stock: 4, images: '/products/electrical-parts.png', sku: 'RG-ELC-027', partNumber: 'HN-CTY-STR01', categoryId: electricalParts.id, carModelId: city.id, featured: 0 },
    { name: 'Suzuki WagonR Oxygen Sensor (Used)', slug: 'suzuki-wagonr-oxygen-sensor-used', description: 'Used O2 sensor for Suzuki WagonR K10B engine. Helps maintain proper air-fuel ratio.', price: 3500, condition: 'used', stock: 6, images: '/products/electrical-parts.png', sku: 'RG-ELC-028', partNumber: 'SZ-WGR-O2S01', categoryId: electricalParts.id, carModelId: wagonR.id, featured: 0 },
    { name: 'MG HS LED Tail Light (Right)', slug: 'mg-hs-led-tail-light-right', description: 'Brand new LED tail light assembly for MG HS right side. Modern LED technology.', price: 15000, condition: 'new', stock: 8, images: '/products/electrical-parts.png', sku: 'RG-ELC-029', partNumber: 'MG-HS-RTL01', categoryId: electricalParts.id, carModelId: mgHs.id, featured: 0 },
    { name: 'Hyundai Tucson MAP Sensor', slug: 'hyundai-tucson-map-sensor', description: 'Manifold absolute pressure sensor for Hyundai Tucson. Essential for proper engine management.', price: 6800, condition: 'new', stock: 10, images: '/products/electrical-parts.png', sku: 'RG-ELC-030', partNumber: 'HY-TCS-MAP01', categoryId: electricalParts.id, carModelId: tucson.id, featured: 0 },
    { name: 'Suzuki Mehran Horn Set', slug: 'suzuki-mehran-horn-set', description: 'Replacement horn set for Suzuki Mehran. High and low tone pair.', price: 1200, condition: 'new', stock: 25, images: '/products/electrical-parts.png', sku: 'RG-ELC-031', partNumber: 'SZ-MRN-HRN01', categoryId: electricalParts.id, carModelId: mehran.id, featured: 0 },

    // Suspension Parts
    { name: 'Toyota Corolla Front Shock Absorbers (Pair)', slug: 'toyota-corolla-front-shock-absorbers-pair', description: 'Brand new front shock absorbers for Toyota Corolla XLI/GLI. Gas-charged for superior damping.', price: 14000, condition: 'new', stock: 12, images: '/products/suspension-parts.png', sku: 'RG-SUS-032', partNumber: 'TY-CRL-FSA01', categoryId: suspensionParts.id, carModelId: corollaXli.id, featured: 1 },
    { name: 'Suzuki Alto Rear Shock Absorbers (Pair, Used)', slug: 'suzuki-alto-rear-shock-absorbers-pair-used', description: 'Used rear shock absorbers for Suzuki Alto. Still in decent working condition.', price: 3500, condition: 'used', stock: 6, images: '/products/suspension-parts.png', sku: 'RG-SUS-033', partNumber: 'SZ-ALT-RSA01', categoryId: suspensionParts.id, carModelId: alto.id, featured: 0 },
    { name: 'Honda Civic Front Coil Springs (Pair)', slug: 'honda-civic-front-coil-springs-pair', description: 'Front coil springs for Honda Civic 2016-2021. Heavy-duty construction.', price: 7500, condition: 'new', stock: 10, images: '/products/suspension-parts.png', sku: 'RG-SUS-034', partNumber: 'HN-CVC-FCS01', categoryId: suspensionParts.id, carModelId: civic.id, featured: 0 },
    { name: 'Suzuki WagonR Lower Control Arm (Left, Used)', slug: 'suzuki-wagonr-lower-control-arm-left-used', description: 'Used lower control arm for Suzuki WagonR left side. Ball joint and bushings intact.', price: 4000, condition: 'used', stock: 4, images: '/products/suspension-parts.png', sku: 'RG-SUS-035', partNumber: 'SZ-WGR-LCA01', categoryId: suspensionParts.id, carModelId: wagonR.id, featured: 0 },
    { name: 'Daihatsu Coure Suspension Bushings Kit', slug: 'daihatsu-coure-suspension-bushings-kit', description: 'Complete suspension bushing kit for Daihatsu Coure. Polyurethane material for longer life.', price: 3200, condition: 'new', stock: 15, images: '/products/suspension-parts.png', sku: 'RG-SUS-036', partNumber: 'DH-CRE-SBK01', categoryId: suspensionParts.id, carModelId: coure.id, featured: 0 },
    { name: 'MG ZS Rear Shock Absorbers (Pair)', slug: 'mg-zs-rear-shock-absorbers-pair', description: 'New rear shock absorbers for MG ZS. Gas-charged for improved stability and comfort.', price: 16000, condition: 'new', stock: 8, images: '/products/suspension-parts.png', sku: 'RG-SUS-037', partNumber: 'MG-ZS-RSA01', categoryId: suspensionParts.id, carModelId: mgZs.id, featured: 0 },
    { name: 'Hyundai Tucson Front Control Arm (Right, Used)', slug: 'hyundai-tucson-front-control-arm-right-used', description: 'Used right front control arm for Hyundai Tucson. Ball joint in good condition.', price: 9500, condition: 'used', stock: 3, images: '/products/suspension-parts.png', sku: 'RG-SUS-038', partNumber: 'HY-TCS-RCA01', categoryId: suspensionParts.id, carModelId: tucson.id, featured: 0 },

    // Brake Parts
    { name: 'Toyota Corolla Front Brake Pads', slug: 'toyota-corolla-front-brake-pads', description: 'Premium ceramic front brake pads for Toyota Corolla XLI/GLI. Low dust formulation.', price: 4500, condition: 'new', stock: 25, images: '/products/brake-parts.png', sku: 'RG-BRK-039', partNumber: 'TY-CRL-FBP01', categoryId: brakeParts.id, carModelId: corollaXli.id, featured: 1 },
    { name: 'Honda City Front Brake Rotors (Pair)', slug: 'honda-city-front-brake-rotors-pair', description: 'Front brake disc rotors for Honda City. Vented design for better heat dissipation.', price: 8000, condition: 'new', stock: 10, images: '/products/brake-parts.png', sku: 'RG-BRK-040', partNumber: 'HN-CTY-FDR01', categoryId: brakeParts.id, carModelId: city.id, featured: 0 },
    { name: 'Suzuki Alto Brake Caliper (Front Left, Used)', slug: 'suzuki-alto-brake-caliper-front-left-used', description: 'Used front left brake caliper for Suzuki Alto. Piston moves freely, no leaks.', price: 2800, condition: 'used', stock: 5, images: '/products/brake-parts.png', sku: 'RG-BRK-041', partNumber: 'SZ-ALT-FLC01', categoryId: brakeParts.id, carModelId: alto.id, featured: 0 },
    { name: 'Suzuki Mehran Rear Brake Shoes', slug: 'suzuki-mehran-rear-brake-shoes', description: 'Rear brake shoes for Suzuki Mehran. High-quality friction material for reliable braking.', price: 1200, condition: 'new', stock: 35, images: '/products/brake-parts.png', sku: 'RG-BRK-042', partNumber: 'SZ-MRN-RBS01', categoryId: brakeParts.id, carModelId: mehran.id, featured: 0 },
    { name: 'Honda Civic Brake Lines Kit', slug: 'honda-civic-brake-lines-kit', description: 'Complete brake line kit for Honda Civic. Pre-bent steel lines with correct fittings.', price: 5500, condition: 'new', stock: 8, images: '/products/brake-parts.png', sku: 'RG-BRK-043', partNumber: 'HN-CVC-BLK01', categoryId: brakeParts.id, carModelId: civic.id, featured: 0 },
    { name: 'Suzuki Cultus Front Brake Pads (Used)', slug: 'suzuki-cultus-front-brake-pads-used', description: 'Used front brake pads for Suzuki Cultus with approximately 60% life remaining.', price: 1500, condition: 'used', stock: 4, images: '/products/brake-parts.png', sku: 'RG-BRK-044', partNumber: 'SZ-CLS-FBP01', categoryId: brakeParts.id, carModelId: cultus.id, featured: 0 },
    { name: 'MG HS Front Brake Pads', slug: 'mg-hs-front-brake-pads', description: 'Front brake pads for MG HS. Semi-metallic compound for consistent braking.', price: 6500, condition: 'new', stock: 12, images: '/products/brake-parts.png', sku: 'RG-BRK-045', partNumber: 'MG-HS-FBP01', categoryId: brakeParts.id, carModelId: mgHs.id, featured: 0 },

    // Transmission Parts
    { name: 'Honda City Clutch Kit (Complete)', slug: 'honda-city-clutch-kit-complete', description: 'Complete clutch kit for Honda City 1.5L. Includes clutch disc, pressure plate, and release bearing.', price: 12000, condition: 'new', stock: 10, images: '/products/transmission-parts.png', sku: 'RG-TRN-046', partNumber: 'HN-CTY-CK01', categoryId: transmissionParts.id, carModelId: city.id, featured: 1 },
    { name: 'Suzuki Mehran Clutch Cable', slug: 'suzuki-mehran-clutch-cable', description: 'Replacement clutch cable for Suzuki Mehran. Stainless steel inner wire.', price: 950, condition: 'new', stock: 20, images: '/products/transmission-parts.png', sku: 'RG-TRN-047', partNumber: 'SZ-MRN-CC01', categoryId: transmissionParts.id, carModelId: mehran.id, featured: 0 },
    { name: 'Toyota Corolla CV Axle (Right, Used)', slug: 'toyota-corolla-cv-axle-right-used', description: 'Used right CV axle/driveshaft for Toyota Corolla. Boots intact, no clicking noise.', price: 7000, condition: 'used', stock: 4, images: '/products/transmission-parts.png', sku: 'RG-TRN-048', partNumber: 'TY-CRL-RAX01', categoryId: transmissionParts.id, carModelId: corollaGli.id, featured: 0 },
    { name: 'Suzuki Alto Gear Shift Cable', slug: 'suzuki-alto-gear-shift-cable', description: 'Gear shift cable for Suzuki Alto. OEM-quality replacement for smooth gear changes.', price: 2200, condition: 'new', stock: 15, images: '/products/transmission-parts.png', sku: 'RG-TRN-049', partNumber: 'SZ-ALT-GSC01', categoryId: transmissionParts.id, carModelId: alto.id, featured: 0 },
    { name: 'Honda Civic Clutch Master Cylinder (Used)', slug: 'honda-civic-clutch-master-cylinder-used', description: 'Used clutch master cylinder for Honda Civic. No leaks, piston operates smoothly.', price: 4500, condition: 'used', stock: 3, images: '/products/transmission-parts.png', sku: 'RG-TRN-050', partNumber: 'HN-CVC-CMC01', categoryId: transmissionParts.id, carModelId: civic.id, featured: 0 },
    { name: 'Suzuki WagonR CV Joint (Left, Used)', slug: 'suzuki-wagonr-cv-joint-left-used', description: 'Used left CV joint for Suzuki WagonR. Good condition with no play or noise.', price: 3200, condition: 'used', stock: 5, images: '/products/transmission-parts.png', sku: 'RG-TRN-051', partNumber: 'SZ-WGR-LCV01', categoryId: transmissionParts.id, carModelId: wagonR.id, featured: 0 },
    { name: 'Daihatsu Coure Clutch Kit', slug: 'daihatsu-coure-clutch-kit', description: 'Brand new clutch kit for Daihatsu Coure. Includes clutch plate, pressure plate, and thrust bearing.', price: 5500, condition: 'new', stock: 8, images: '/products/transmission-parts.png', sku: 'RG-TRN-052', partNumber: 'DH-CRE-CK01', categoryId: transmissionParts.id, carModelId: coure.id, featured: 0 },
    { name: 'Suzuki Cultus Gearbox Mount (Used)', slug: 'suzuki-cultus-gearbox-mount-used', description: 'Used gearbox/transmission mount for Suzuki Cultus. Rubber still firm.', price: 1800, condition: 'used', stock: 4, images: '/products/transmission-parts.png', sku: 'RG-TRN-053', partNumber: 'SZ-CLS-GM01', categoryId: transmissionParts.id, carModelId: cultus.id, featured: 0 },

    // AC & Cooling
    { name: 'Toyota Corolla AC Compressor (Used)', slug: 'toyota-corolla-ac-compressor-used', description: 'Used AC compressor for Toyota Corolla. Tested and blowing cold.', price: 15000, condition: 'used', stock: 4, images: '/products/ac-cooling.png', sku: 'RG-ACC-054', partNumber: 'TY-CRL-ACP01', categoryId: acCooling.id, carModelId: corollaXli.id, featured: 0 },
    { name: 'Honda City Radiator (New)', slug: 'honda-city-radiator-new', description: 'Brand new aluminum radiator for Honda City. High-efficiency core design.', price: 11000, condition: 'new', stock: 8, images: '/products/ac-cooling.png', sku: 'RG-ACC-055', partNumber: 'HN-CTY-RAD01', categoryId: acCooling.id, carModelId: city.id, featured: 1 },
    { name: 'Suzuki Alto AC Condenser', slug: 'suzuki-alto-ac-condenser', description: 'AC condenser for Suzuki Alto. Aluminum construction for efficient heat exchange.', price: 6500, condition: 'new', stock: 10, images: '/products/ac-cooling.png', sku: 'RG-ACC-056', partNumber: 'SZ-ALT-ACD01', categoryId: acCooling.id, carModelId: alto.id, featured: 0 },
    { name: 'Suzuki Mehran Radiator (Used)', slug: 'suzuki-mehran-radiator-used', description: 'Used radiator for Suzuki Mehran. No leaks, fins in decent condition.', price: 4500, condition: 'used', stock: 5, images: '/products/ac-cooling.png', sku: 'RG-ACC-057', partNumber: 'SZ-MRN-RAD01', categoryId: acCooling.id, carModelId: mehran.id, featured: 0 },
    { name: 'Honda Civic Cooling Fan Assembly', slug: 'honda-civic-cooling-fan-assembly', description: 'Complete cooling fan assembly for Honda Civic. Includes fan motor, blades, and shroud.', price: 7500, condition: 'new', stock: 8, images: '/products/ac-cooling.png', sku: 'RG-ACC-058', partNumber: 'HN-CVC-CFA01', categoryId: acCooling.id, carModelId: civic.id, featured: 0 },
    { name: 'Suzuki WagonR Thermostat', slug: 'suzuki-wagonr-thermostat', description: 'Replacement thermostat for Suzuki WagonR K10B engine. Opens at 82°C.', price: 950, condition: 'new', stock: 20, images: '/products/ac-cooling.png', sku: 'RG-ACC-059', partNumber: 'SZ-WGR-THM01', categoryId: acCooling.id, carModelId: wagonR.id, featured: 0 },
    { name: 'Hyundai Tucson AC Compressor', slug: 'hyundai-tucson-ac-compressor', description: 'Brand new AC compressor for Hyundai Tucson. High-quality replacement.', price: 35000, condition: 'new', stock: 5, images: '/products/ac-cooling.png', sku: 'RG-ACC-060', partNumber: 'HY-TCS-ACP01', categoryId: acCooling.id, carModelId: tucson.id, featured: 0 },
    { name: 'MG HS Radiator Cooling Fan (Used)', slug: 'mg-hs-radiator-cooling-fan-used', description: 'Used radiator cooling fan for MG HS. Motor and blades in good working condition.', price: 8500, condition: 'used', stock: 3, images: '/products/ac-cooling.png', sku: 'RG-ACC-061', partNumber: 'MG-HS-CFA01', categoryId: acCooling.id, carModelId: mgHs.id, featured: 0 },
    { name: 'Toyota Corolla GLI AC Expansion Valve', slug: 'toyota-corolla-gli-ac-expansion-valve', description: 'AC expansion valve for Toyota Corolla GLI. Controls refrigerant flow for optimal AC performance.', price: 2800, condition: 'new', stock: 12, images: '/products/ac-cooling.png', sku: 'RG-ACC-062', partNumber: 'TY-CGL-AEV01', categoryId: acCooling.id, carModelId: corollaGli.id, featured: 0 },
    { name: 'Suzuki Cultus Water Pump', slug: 'suzuki-cultus-water-pump', description: 'New water pump for Suzuki Cultus. Heavy-duty impeller design for efficient coolant circulation.', price: 4200, condition: 'new', stock: 10, images: '/products/ac-cooling.png', sku: 'RG-ACC-063', partNumber: 'SZ-CLS-WP01', categoryId: acCooling.id, carModelId: cultus.id, featured: 0 },

    // Extra Products
    { name: 'Suzuki WagonR AC Cabin Filter', slug: 'suzuki-wagonr-ac-cabin-filter', description: 'Cabin air filter for Suzuki WagonR. Activated carbon layer filters dust, pollen, and odors.', price: 1100, condition: 'new', stock: 30, images: '/products/engine-parts.png', sku: 'RG-CFL-064', partNumber: 'SZ-WGR-CF01', categoryId: engineParts.id, carModelId: wagonR.id, featured: 0 },
    { name: 'Daihatsu Coure Alternator (Used)', slug: 'daihatsu-coure-alternator-used', description: 'Used alternator for Daihatsu Coure. Output: 45A. Tested and charging properly.', price: 5000, condition: 'used', stock: 3, images: '/products/electrical-parts.png', sku: 'RG-ELC-065', partNumber: 'DH-CRE-ALT01', categoryId: electricalParts.id, carModelId: coure.id, featured: 0 },
    { name: 'MG ZS Front Brake Discs (Pair)', slug: 'mg-zs-front-brake-discs-pair', description: 'Front brake disc rotors for MG ZS. Precision-machined for smooth braking performance.', price: 9000, condition: 'new', stock: 6, images: '/products/brake-parts.png', sku: 'RG-BRK-066', partNumber: 'MG-ZS-FDR01', categoryId: brakeParts.id, carModelId: mgZs.id, featured: 0 },
    { name: 'Hyundai Tucson Suspension Strut (Front Right, Used)', slug: 'hyundai-tucson-suspension-strut-front-right-used', description: 'Used front right suspension strut for Hyundai Tucson. No leaks, good damping.', price: 11000, condition: 'used', stock: 2, images: '/products/suspension-parts.png', sku: 'RG-SUS-067', partNumber: 'HY-TCS-FSS01', categoryId: suspensionParts.id, carModelId: tucson.id, featured: 0 },
  ]

  for (const p of products) {
    await client.execute({
      sql: 'INSERT INTO Product (id, name, slug, description, price, condition, stock, images, sku, partNumber, categoryId, carModelId, featured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [cuid(), p.name, p.slug, p.description, p.price, p.condition, p.stock, p.images, p.sku, p.partNumber, p.categoryId, p.carModelId, p.featured, isoNow(), isoNow()],
    })
  }
  console.log(`✅ Created ${products.length} products.`)

  console.log('')
  console.log('🎉 Turso database setup complete!')
  console.log('')
  console.log('Your Vercel deployment should now work with these environment variables:')
  console.log(`  TURSO_DATABASE_URL = ${url}`)
  console.log(`  TURSO_AUTH_TOKEN   = ${token}`)
  console.log(`  DATABASE_URL       = file:./db/local.db`)
}

main().catch((err) => {
  console.error('❌ Setup failed:', err)
  process.exit(1)
})
