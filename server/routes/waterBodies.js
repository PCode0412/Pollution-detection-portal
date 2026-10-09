const express = require('express');
const db = require('../db');
const { calculatePPI } = require('../services/analyticsService');
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/water-bodies - Get all water bodies with computed PPI & observation counts
router.get('/', async (req, res) => {
  try {
    const waterBodies = await db.query('SELECT * FROM water_bodies ORDER BY name ASC');

    const result = await Promise.all(
      waterBodies.map(async (wb) => {
        const locations = await db.query('SELECT id FROM observation_points WHERE water_body_id = ?', [wb.id]);
        const locIds = locations.map((l) => l.id);

        let records = [];
        if (locIds.length > 0) {
          const placeholders = locIds.map(() => '?').join(',');
          records = await db.query(
            `SELECT * FROM pollution_records WHERE observation_point_id IN (${placeholders})`,
            locIds
          );
        }

        const metrics = calculatePPI(records);

        return {
          ...wb,
          observationPointsCount: locIds.length,
          totalRecordsCount: records.length,
          ppi: metrics.ppi,
          status: metrics.status,
          avgQtyKg: metrics.avgQty,
          totalQtyKg: metrics.totalQty,
          totalEstimatedItems: metrics.totalItems
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('Error fetching water bodies:', err);
    res.status(500).json({ error: 'Failed to retrieve water bodies' });
  }
});

// GET /api/water-bodies/:id - Single water body detailed info
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const wbRows = await db.query('SELECT * FROM water_bodies WHERE id = ?', [id]);

    if (!wbRows || wbRows.length === 0) {
      return res.status(404).json({ error: 'Water body not found' });
    }

    const waterBody = wbRows[0];
    const locations = await db.query(
      'SELECT * FROM observation_points WHERE water_body_id = ? ORDER BY name ASC',
      [id]
    );

    const locIds = locations.map((l) => l.id);
    let records = [];
    if (locIds.length > 0) {
      const placeholders = locIds.map(() => '?').join(',');
      records = await db.query(
        `SELECT pr.*, op.name as location_name, pt.name as plastic_type_name
         FROM pollution_records pr
         JOIN observation_points op ON pr.observation_point_id = op.id
         JOIN plastic_types pt ON pr.plastic_type_id = pt.id
         WHERE pr.observation_point_id IN (${placeholders})
         ORDER BY pr.date DESC`,
        locIds
      );
    }

    const cleanups = locIds.length > 0 ? await db.query(
      `SELECT cr.*, op.name as location_name 
       FROM cleanup_records cr 
       JOIN observation_points op ON cr.observation_point_id = op.id
       WHERE cr.observation_point_id IN (${locIds.map(() => '?').join(',')})
       ORDER BY cr.date DESC`,
      locIds
    ) : [];

    const ppiMetrics = calculatePPI(records);

    // Compute observation point specific stats
    const locationsWithMetrics = locations.map((loc) => {
      const locRecords = records.filter((r) => r.observation_point_id === loc.id);
      const locPpi = calculatePPI(locRecords);
      return {
        ...loc,
        recordCount: locRecords.length,
        ppi: locPpi.ppi,
        status: locPpi.status,
        avgQtyKg: locPpi.avgQty,
        totalQtyKg: locPpi.totalQty
      };
    });

    res.json({
      waterBody,
      ppiMetrics,
      locations: locationsWithMetrics,
      recentRecords: records.slice(0, 50),
      cleanups
    });
  } catch (err) {
    console.error('Error fetching water body detail:', err);
    res.status(500).json({ error: 'Failed to retrieve water body detail' });
  }
});

// Admin CRUD Routes for Water Bodies
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { name, type, description, latitude, longitude } = req.body;
    if (!name || !type || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Missing required fields: name, type, latitude, longitude' });
    }

    const result = await db.query(
      'INSERT INTO water_bodies (name, type, description, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [name, type, description || '', parseFloat(latitude), parseFloat(longitude)]
    );

    res.status(201).json({ message: 'Water body created', id: result.insertId });
  } catch (err) {
    console.error('Error creating water body:', err);
    res.status(500).json({ error: 'Failed to create water body' });
  }
});

router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, latitude, longitude } = req.body;

    await db.query(
      'UPDATE water_bodies SET name = ?, type = ?, description = ?, latitude = ?, longitude = ? WHERE id = ?',
      [name, type, description || '', parseFloat(latitude), parseFloat(longitude), id]
    );

    res.json({ message: 'Water body updated successfully' });
  } catch (err) {
    console.error('Error updating water body:', err);
    res.status(500).json({ error: 'Failed to update water body' });
  }
});

router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM water_bodies WHERE id = ?', [id]);
    res.json({ message: 'Water body deleted successfully' });
  } catch (err) {
    console.error('Error deleting water body:', err);
    res.status(500).json({ error: 'Failed to delete water body' });
  }
});

module.exports = router;
