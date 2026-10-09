const express = require('express');
const db = require('../db');
const { calculatePPI, classifyHotspot } = require('../services/analyticsService');
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/locations - Get all observation points with computed PPI, latest status & water body info
router.get('/', async (req, res) => {
  try {
    const { water_body_id } = req.query;
    let queryStr = `
      SELECT op.*, wb.name as water_body_name, wb.type as water_body_type
      FROM observation_points op
      JOIN water_bodies wb ON op.water_body_id = wb.id
    `;
    const params = [];

    if (water_body_id) {
      queryStr += ' WHERE op.water_body_id = ?';
      params.push(water_body_id);
    }

    queryStr += ' ORDER BY wb.name ASC, op.name ASC';

    const locations = await db.query(queryStr, params);

    const locationsWithMetrics = await Promise.all(
      locations.map(async (loc) => {
        const records = await db.query(
          'SELECT * FROM pollution_records WHERE observation_point_id = ? ORDER BY year ASC',
          [loc.id]
        );

        const metrics = calculatePPI(records);

        // Group by year for hotspot classification
        const yearGroups = {};
        records.forEach((r) => {
          if (!yearGroups[r.year]) yearGroups[r.year] = [];
          yearGroups[r.year].push(r);
        });

        const yearlyPpi = {};
        Object.keys(yearGroups).forEach((yr) => {
          yearlyPpi[yr] = calculatePPI(yearGroups[yr]).ppi;
        });

        const hotspotCategory = classifyHotspot(yearlyPpi);

        return {
          ...loc,
          recordCount: records.length,
          ppi: metrics.ppi,
          status: metrics.status,
          avgQtyKg: metrics.avgQty,
          totalQtyKg: metrics.totalQty,
          totalItems: metrics.totalItems,
          hotspotCategory,
          yearlyPpi
        };
      })
    );

    res.json(locationsWithMetrics);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Failed to retrieve observation points' });
  }
});

// Admin CRUD Routes
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { water_body_id, name, description, latitude, longitude } = req.body;
    if (!water_body_id || !name || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      'INSERT INTO observation_points (water_body_id, name, description, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [water_body_id, name, description || '', parseFloat(latitude), parseFloat(longitude)]
    );

    res.status(201).json({ message: 'Observation point created', id: result.insertId });
  } catch (err) {
    console.error('Error creating location:', err);
    res.status(500).json({ error: 'Failed to create observation point' });
  }
});

router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { water_body_id, name, description, latitude, longitude } = req.body;

    await db.query(
      'UPDATE observation_points SET water_body_id = ?, name = ?, description = ?, latitude = ?, longitude = ? WHERE id = ?',
      [water_body_id, name, description || '', parseFloat(latitude), parseFloat(longitude), id]
    );

    res.json({ message: 'Observation point updated successfully' });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update observation point' });
  }
});

router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM observation_points WHERE id = ?', [id]);
    res.json({ message: 'Observation point deleted successfully' });
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ error: 'Failed to delete observation point' });
  }
});

module.exports = router;
