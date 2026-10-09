const db = require('../db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('Starting database schema creation and data seeding...');
  await db.initDbConnection();

  const isMysql = db.getDbType() === 'mysql';

  // 1. Drop existing tables if re-seeding
  if (isMysql) {
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');
    await db.query('DROP TABLE IF EXISTS cleanup_records;');
    await db.query('DROP TABLE IF EXISTS pollution_records;');
    await db.query('DROP TABLE IF EXISTS plastic_types;');
    await db.query('DROP TABLE IF EXISTS observation_points;');
    await db.query('DROP TABLE IF EXISTS water_bodies;');
    await db.query('DROP TABLE IF EXISTS administrators;');
    await db.query('SET FOREIGN_KEY_CHECKS = 1;');
  } else {
    await db.query('DROP TABLE IF EXISTS cleanup_records;');
    await db.query('DROP TABLE IF EXISTS pollution_records;');
    await db.query('DROP TABLE IF EXISTS plastic_types;');
    await db.query('DROP TABLE IF EXISTS observation_points;');
    await db.query('DROP TABLE IF EXISTS water_bodies;');
    await db.query('DROP TABLE IF EXISTS administrators;');
  }

  // 2. Create tables
  const autoInc = isMysql ? 'AUTO_INCREMENT' : 'AUTOINCREMENT';

  await db.query(`
    CREATE TABLE administrators (
      id INTEGER PRIMARY KEY ${autoInc},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE water_bodies (
      id INTEGER PRIMARY KEY ${autoInc},
      name VARCHAR(150) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE observation_points (
      id INTEGER PRIMARY KEY ${autoInc},
      water_body_id INTEGER NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (water_body_id) REFERENCES water_bodies(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE plastic_types (
      id INTEGER PRIMARY KEY ${autoInc},
      name VARCHAR(100) NOT NULL,
      description TEXT,
      hazard_weight REAL DEFAULT 1.0
    );
  `);

  await db.query(`
    CREATE TABLE pollution_records (
      id INTEGER PRIMARY KEY ${autoInc},
      observation_point_id INTEGER NOT NULL,
      plastic_type_id INTEGER NOT NULL,
      date DATE NOT NULL,
      year INTEGER NOT NULL,
      quantity_kg REAL NOT NULL,
      estimated_items INTEGER NOT NULL,
      severity VARCHAR(20) NOT NULL,
      description TEXT,
      source_type VARCHAR(100) DEFAULT 'Field Survey',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (observation_point_id) REFERENCES observation_points(id) ON DELETE CASCADE,
      FOREIGN KEY (plastic_type_id) REFERENCES plastic_types(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE cleanup_records (
      id INTEGER PRIMARY KEY ${autoInc},
      observation_point_id INTEGER NOT NULL,
      date DATE NOT NULL,
      waste_collected_kg REAL NOT NULL,
      volunteers_count INTEGER NOT NULL,
      organizer VARCHAR(150) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (observation_point_id) REFERENCES observation_points(id) ON DELETE CASCADE
    );
  `);

  console.log('Tables created successfully.');

  // 3. Seed Administrators
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  await db.query(
    'INSERT INTO administrators (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['System Admin', 'admin@chennaiwater.org', adminPasswordHash, 'superadmin']
  );

  // 4. Seed Water Bodies
  const waterBodiesData = [
    {
      name: 'Marina Beach Shoreline',
      type: 'Beach',
      description: 'World second longest urban beach located along the Coromandel Coast of the Bay of Bengal.',
      latitude: 13.0475,
      longitude: 80.2824
    },
    {
      name: 'Cooum River',
      type: 'River',
      description: 'Urban river flowing east through central Chennai into the Bay of Bengal near Napier Bridge.',
      latitude: 13.0694,
      longitude: 80.2842
    },
    {
      name: 'Adyar River & Estuary',
      type: 'River',
      description: 'Southern Chennai river flowing into the Bay of Bengal forming an ecologically sensitive estuary.',
      latitude: 13.0118,
      longitude: 80.2731
    },
    {
      name: "Elliot's Beach (Besant Nagar)",
      type: 'Beach',
      description: 'Popular coastal destination in South Chennai near the mouth of Adyar river estuary.',
      latitude: 12.9995,
      longitude: 80.2721
    },
    {
      name: 'Ennore Creek & Wetlands',
      type: 'Estuary/Creek',
      description: 'Major estuarine backwater system in North Chennai surrounded by ports and industrial zones.',
      latitude: 13.2201,
      longitude: 80.3150
    },
    {
      name: 'Kovalam Beach & Cove',
      type: 'Beach',
      description: 'Coastal cove south of Chennai on East Coast Road popular for water sports and fishing.',
      latitude: 12.7915,
      longitude: 80.2520
    },
    {
      name: 'Buckingham Canal',
      type: 'Canal',
      description: 'Historic fresh to brackish water navigation canal running parallel to the Coromandel Coast.',
      latitude: 13.0012,
      longitude: 80.2541
    }
  ];

  const wbIds = {};
  for (const wb of waterBodiesData) {
    const res = await db.query(
      'INSERT INTO water_bodies (name, type, description, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [wb.name, wb.type, wb.description, wb.latitude, wb.longitude]
    );
    wbIds[wb.name] = res.insertId;
  }

  // 5. Seed Observation Points (~25 points)
  const observationPointsData = [
    // Marina Beach
    { wb: 'Marina Beach Shoreline', name: 'Lighthouse Promenade Shore', lat: 13.0392, lng: 80.2798, desc: 'High footfall zone near Chennai Lighthouse' },
    { wb: 'Marina Beach Shoreline', name: 'Central Promenade / Triumph Statue', lat: 13.0488, lng: 80.2831, desc: 'Central visitor concourse with intense food vendor activity' },
    { wb: 'Marina Beach Shoreline', name: 'Napier Bridge End (Marina North)', lat: 13.0664, lng: 80.2871, desc: 'Northern tip where Cooum river outlet deposits riverine debris' },
    { wb: 'Marina Beach Shoreline', name: 'Fishing Harbour South Confluence', lat: 13.0298, lng: 80.2764, desc: 'Near Foreshore Estate fishing village landing area' },

    // Cooum River
    { wb: 'Cooum River', name: 'Napier Bridge River Outlet', lat: 13.0694, lng: 80.2858, desc: 'River mouth before emptying into Bay of Bengal' },
    { wb: 'Cooum River', name: 'Egmore Railway Bridge Stretch', lat: 13.0768, lng: 80.2612, desc: 'Central urban stretch subject to heavy urban runoff' },
    { wb: 'Cooum River', name: 'Chetpet Railway Crossing Zone', lat: 13.0725, lng: 80.2411, desc: 'Mid-stream residential-commercial urban boundary' },
    { wb: 'Cooum River', name: 'Koyambedu Upstream Reach', lat: 13.0712, lng: 80.1982, desc: 'Upstream section near wholesale vegetable market drains' },

    // Adyar River
    { wb: 'Adyar River & Estuary', name: 'Adyar Estuary Creek', lat: 13.0118, lng: 80.2731, desc: 'Sensitive ecological creek zone inside Adyar Poonga boundary' },
    { wb: 'Adyar River & Estuary', name: 'Broken Bridge Coastal Confluence', lat: 13.0142, lng: 80.2762, desc: 'Disused bridge mouth with tidal wave debris accumulation' },
    { wb: 'Adyar River & Estuary', name: 'Kotturpuram Bridge Stretch', lat: 13.0210, lng: 80.2450, desc: 'Densely populated residential river bank section' },
    { wb: 'Adyar River & Estuary', name: 'Manapakkam Upstream River Bed', lat: 13.0125, lng: 80.1789, desc: 'Suburban inflow stretch entering urban limits' },

    // Elliot's Beach
    { wb: 'Elliot\'s Beach (Besant Nagar)', name: 'Schmidt Memorial Beachfront', lat: 12.9995, lng: 80.2721, desc: 'Main public promenade and recreational area' },
    { wb: 'Elliot\'s Beach (Besant Nagar)', name: 'Urur Olcott Kuppam Shore', lat: 12.9931, lng: 80.2710, desc: 'Southern fishing hamlet beach landing area' },
    { wb: 'Elliot\'s Beach (Besant Nagar)', name: 'North Estuary Sands', lat: 13.0078, lng: 80.2745, desc: 'Northern beach stretch adjoining Adyar river mouth' },

    // Ennore Creek
    { wb: 'Ennore Creek & Wetlands', name: 'Kattupalli Estuary Channel', lat: 13.2201, lng: 80.3150, desc: 'Industrial and port shipping corridor mouth' },
    { wb: 'Ennore Creek & Wetlands', name: 'NCTPS Thermal Channel Outlet', lat: 13.2085, lng: 80.3012, desc: 'Channel near thermal power station and fly ash ponds' },
    { wb: 'Ennore Creek & Wetlands', name: 'Ennore Railway Bridge Crossing', lat: 13.2140, lng: 80.2925, desc: 'Tidal creek mudflat crossing' },

    // Kovalam Beach
    { wb: 'Kovalam Beach & Cove', name: 'Kovalam Point & Surf Line', lat: 12.7915, lng: 80.2520, desc: 'Active surfing bay and tourist shoreline' },
    { wb: 'Kovalam Beach & Cove', name: 'Fishing Village South Cove', lat: 12.7850, lng: 80.2505, desc: 'Fisherman boat launch and gear maintenance cove' },
    { wb: 'Kovalam Beach & Cove', name: 'Muttukadu Outlet Sandbar', lat: 12.8092, lng: 80.2481, desc: 'Seasonal sandbar separating backwater from ocean' },

    // Buckingham Canal
    { wb: 'Buckingham Canal', name: 'Mylapore Canal Stretch', lat: 13.0335, lng: 80.2589, desc: 'Urban canal corridor adjacent to MRTS station line' },
    { wb: 'Buckingham Canal', name: 'Velachery Drain Junction', lat: 12.9785, lng: 80.2312, desc: 'Confluence of stormwater drains and canal' },
    { wb: 'Buckingham Canal', name: 'Sholinganallur IT Stretch', lat: 12.8995, lng: 80.2285, desc: 'Suburban IT corridor canal banks' }
  ];

  const opIds = {};
  for (const op of observationPointsData) {
    const res = await db.query(
      'INSERT INTO observation_points (water_body_id, name, description, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [wbIds[op.wb], op.name, op.desc, op.lat, op.lng]
    );
    opIds[op.name] = res.insertId;
  }

  // 6. Seed Plastic Types
  const plasticTypesData = [
    { name: 'Single-use Carry Bags & Film', desc: 'LDPE/HDPE thin plastic bags, grocery bags, single-use films', weight: 1.2 },
    { name: 'PET Bottles & Beverage Caps', desc: 'Transparent drink bottles, mineral water bottles, caps', weight: 1.0 },
    { name: 'Food Packaging & Snack Wrappers', desc: 'Multi-layer laminated wrappers, biscuit packaging, chip bags', weight: 1.1 },
    { name: 'Microplastics & Nurdles', desc: 'Small plastic fragments (<5mm), industrial resin pellets', weight: 1.5 },
    { name: 'Abandoned Fishing Nets & Ropes', desc: 'Nylon fishing gear, ghost nets, synthetic ropes, monofilament', weight: 1.4 },
    { name: 'Thermocol & Expanded Polystyrene', desc: 'EPS foam food containers, packaging insulation, fish boxes', weight: 1.3 },
    { name: 'Rigid Household & Commercial Containers', desc: 'Shampoo bottles, bucket fragments, hard plastic containers', weight: 0.9 }
  ];

  const ptIds = [];
  for (const pt of plasticTypesData) {
    const res = await db.query(
      'INSERT INTO plastic_types (name, description, hazard_weight) VALUES (?, ?, ?)',
      [pt.name, pt.desc, pt.weight]
    );
    ptIds.push(res.insertId);
  }

  // 7. Seed ~350 Coherent Synthetic Records (2022–2026)
  // We establish clear distinct trends for observation points:
  // - Persistent Hotspots: Cooum River Mouth, Buckingham Canal Mylapore, Ennore Thermal Channel
  // - Emerging Hotspots: Adyar Estuary, Kovalam Surf Point, Velachery Drain Junction
  // - Improving Areas: Marina Central Promenade (due to cleanups), Elliot's Beach Schmidt Memorial
  // - Stable Areas: Manapakkam, Sholinganallur, Kovalam South Cove

  console.log('Generating coherent synthetic pollution records for 2022–2026...');

  const opNames = Object.keys(opIds);
  let recordCount = 0;

  const years = [2022, 2023, 2024, 2025, 2026];
  const months = [1, 3, 5, 7, 9, 11];

  for (const opName of opNames) {
    const opId = opIds[opName];
    
    // Determine trend profile for this point
    let baseQty = 25;
    let trendFactor = 0; // per year change
    let severityBase = 'Moderate';

    if (opName.includes('Napier Bridge') || opName.includes('Mylapore') || opName.includes('NCTPS Thermal')) {
      // Persistent Hotspot (high & steady/rising)
      baseQty = 65;
      trendFactor = 4;
      severityBase = 'Critical';
    } else if (opName.includes('Adyar Estuary') || opName.includes('Velachery Drain') || opName.includes('Kattupalli')) {
      // Emerging Hotspot (low/moderate in 2022 -> high in 2026)
      baseQty = 18;
      trendFactor = 9;
      severityBase = 'Moderate';
    } else if (opName.includes('Central Promenade') || opName.includes('Schmidt Memorial') || opName.includes('Adyar Creek')) {
      // Improving Area (high in 2022 -> low in 2026)
      baseQty = 55;
      trendFactor = -7;
      severityBase = 'High';
    } else {
      // Stable Area
      baseQty = 20;
      trendFactor = 0.5;
      severityBase = 'Low';
    }

    for (let yIdx = 0; yIdx < years.length; yIdx++) {
      const year = years[yIdx];
      // Skip late 2026 months if needed, current year is 2026
      const yearMonths = year === 2026 ? [1, 3, 5, 7, 9] : months;

      for (const month of yearMonths) {
        // Compute realistic date
        const day = 10 + Math.floor(Math.random() * 15);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Select 2-3 plastic types per survey
        const selectedPtCount = 2 + Math.floor(Math.random() * 2);
        const shuffledPts = [...ptIds].sort(() => 0.5 - Math.random()).slice(0, selectedPtCount);

        for (const plasticTypeId of shuffledPts) {
          // Calculate quantity with trend and small random variance
          const yearlyBase = Math.max(5, baseQty + (yIdx * trendFactor));
          const noise = (Math.random() * 0.4) - 0.2; // +/- 20%
          const qtyKg = parseFloat((yearlyBase * (1 + noise)).toFixed(1));
          
          // Estimate item count based on weight (~15-50 items per kg depending on plastic type)
          const itemsPerKg = 15 + (plasticTypeId * 6);
          const estimatedItems = Math.round(qtyKg * itemsPerKg);

          // Calculate severity based on qtyKg
          let severity = 'Low';
          if (qtyKg >= 60) severity = 'Critical';
          else if (qtyKg >= 40) severity = 'High';
          else if (qtyKg >= 20) severity = 'Moderate';

          const sources = ['Bi-monthly Survey', 'Volunteer Field Audit', 'Municipal Coastal Monitoring', 'NGO Shoreline Sampling'];
          const src = sources[Math.floor(Math.random() * sources.length)];

          await db.query(`
            INSERT INTO pollution_records 
            (observation_point_id, plastic_type_id, date, year, quantity_kg, estimated_items, severity, description, source_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            opId,
            plasticTypeId,
            dateStr,
            year,
            qtyKg,
            estimatedItems,
            severity,
            `Synthetic field record at ${opName} during ${year} M${month} survey.`,
            src
          ]);

          recordCount++;
        }
      }
    }
  }

  // 8. Seed Cleanup Drives (~40 records)
  console.log('Seeding cleanup records...');
  const cleanupOrganizers = ['Namma Chennai Clean Campaign', 'Environmentalist Foundation of India (EFI)', 'Tree Foundation Coastal Care', 'GCC Beach Warden Wing', 'Bay of Bengal Foundation'];

  for (const opName of opNames) {
    if (opName.includes('Promenade') || opName.includes('Memorial') || opName.includes('Broken Bridge') || opName.includes('Estuary')) {
      const opId = opIds[opName];
      for (let y = 2023; y <= 2026; y++) {
        const cDate = `${y}-0${(y % 4) + 3}-15`;
        const wasteKg = 150 + Math.floor(Math.random() * 300);
        const volunteers = 35 + Math.floor(Math.random() * 120);
        const org = cleanupOrganizers[Math.floor(Math.random() * cleanupOrganizers.length)];

        await db.query(`
          INSERT INTO cleanup_records (observation_point_id, date, waste_collected_kg, volunteers_count, organizer, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          opId,
          cDate,
          wasteKg,
          volunteers,
          org,
          `Community beach & waterway cleanup drive conducted at ${opName}.`
        ]);
      }
    }
  }

  console.log(`Database seeding completed! Created ${recordCount} synthetic pollution records.`);
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('Database seeding failed:', err);
  process.exit(1);
});
