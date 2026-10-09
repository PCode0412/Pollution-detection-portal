const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const waterBodiesRoutes = require('./routes/waterBodies');
const locationsRoutes = require('./routes/locations');
const pollutionRoutes = require('./routes/pollution');
const analyticsRoutes = require('./routes/analytics');
const cleanupsRoutes = require('./routes/cleanups');

app.use('/api/auth', authRoutes);
app.use('/api/water-bodies', waterBodiesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/pollution', pollutionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cleanups', cleanupsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Plastic Pollution Detection Portal (Chennai Water Bodies)',
    dbType: db.getDbType(),
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  await db.initDbConnection();

  // Auto seed database if fresh
  try {
    const check = await db.query("SELECT COUNT(*) as count FROM water_bodies");
    if (!check || check[0]?.count === 0) {
      console.log("[DB] Empty database detected. Seeding synthetic data...");
      require('./scripts/seed_data');
    }
  } catch (e) {
    console.log("[DB] Initializing database tables...");
    try {
      const execSeed = require('child_process').fork('./scripts/seed_data.js');
    } catch(err) {
      console.log("[DB] Seed script skipped or handled in serverless environment");
    }
  }

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  Plastic Pollution Portal Express API Server Running  `);
      console.log(`  PORT: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'} `);
      console.log(`  DB Engine: ${db.getDbType().toUpperCase()} `);
      console.log(`=======================================================`);
    });
  }
}

startServer();

module.exports = app;
