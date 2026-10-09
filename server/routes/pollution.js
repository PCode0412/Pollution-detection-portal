const express = require('express');
const db = require('../db');
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/pollution - Filterable pollution records
router.get('/', async (req, res) => {
  try {
    const { year, water_body_id, location_id, plastic_type_id, severity, limit } = req.query;

    let queryStr = `
      SELECT pr.*, 
             op.name as location_name, op.latitude as location_lat, op.longitude as location_lng,
             wb.id as water_body_id, wb.name as water_body_name, wb.type as water_body_type,
             pt.name as plastic_type_name, pt.hazard_weight
      FROM pollution_records pr
      JOIN observation_points op ON pr.observation_point_id = op.id
      JOIN water_bodies wb ON op.water_body_id = wb.id
      JOIN plastic_types pt ON pr.plastic_type_id = pt.id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      queryStr += ' AND pr.year = ?';
      params.push(parseInt(year, 10));
    }
    if (water_body_id) {
      queryStr += ' AND wb.id = ?';
      params.push(parseInt(water_body_id, 10));
    }
    if (location_id) {
      queryStr += ' AND pr.observation_point_id = ?';
      params.push(parseInt(location_id, 10));
    }
    if (plastic_type_id) {
      queryStr += ' AND pr.plastic_type_id = ?';
      params.push(parseInt(plastic_type_id, 10));
    }
    if (severity) {
      queryStr += ' AND pr.severity = ?';
      params.push(severity);
    }

    queryStr += ' ORDER BY pr.date DESC, pr.id DESC';

    const records = await db.query(queryStr, params);

    const maxLimit = limit ? parseInt(limit, 10) : 500;
    res.json(records.slice(0, maxLimit));
  } catch (err) {
    console.error('Error fetching pollution records:', err);
    res.status(500).json({ error: 'Failed to retrieve pollution records' });
  }
});

// GET /api/pollution/plastic-types - Plastic categories catalog
router.get('/plastic-types', async (req, res) => {
  try {
    const plasticTypes = await db.query('SELECT * FROM plastic_types ORDER BY name ASC');
    res.json(plasticTypes);
  } catch (err) {
    console.error('Error fetching plastic types:', err);
    res.status(500).json({ error: 'Failed to retrieve plastic types' });
  }
});

// Admin CRUD for pollution records
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { observation_point_id, plastic_type_id, date, quantity_kg, estimated_items, severity, description, source_type } = req.body;
    
    if (!observation_point_id || !plastic_type_id || !date || quantity_kg == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const year = new Date(date).getFullYear();
    const qty = parseFloat(quantity_kg);
    const items = estimated_items ? parseInt(estimated_items, 10) : Math.round(qty * 25);
    
    let computedSeverity = severity;
    if (!computedSeverity) {
      if (qty >= 60) computedSeverity = 'Critical';
      else if (qty >= 40) computedSeverity = 'High';
      else if (qty >= 20) computedSeverity = 'Moderate';
      else computedSeverity = 'Low';
    }

    const result = await db.query(`
      INSERT INTO pollution_records 
      (observation_point_id, plastic_type_id, date, year, quantity_kg, estimated_items, severity, description, source_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      observation_point_id,
      plastic_type_id,
      date,
      year,
      qty,
      items,
      computedSeverity,
      description || '',
      source_type || 'Field Survey'
    ]);

    res.status(201).json({ message: 'Pollution record created', id: result.insertId });
  } catch (err) {
    console.error('Error creating pollution record:', err);
    res.status(500).json({ error: 'Failed to create pollution record' });
  }
});

router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { observation_point_id, plastic_type_id, date, quantity_kg, estimated_items, severity, description, source_type } = req.body;

    const year = new Date(date).getFullYear();
    const qty = parseFloat(quantity_kg);
    const items = parseInt(estimated_items, 10);

    await db.query(`
      UPDATE pollution_records 
      SET observation_point_id = ?, plastic_type_id = ?, date = ?, year = ?, quantity_kg = ?, estimated_items = ?, severity = ?, description = ?, source_type = ?
      WHERE id = ?
    `, [
      observation_point_id,
      plastic_type_id,
      date,
      year,
      qty,
      items,
      severity,
      description || '',
      source_type || 'Field Survey',
      id
    ]);

    res.json({ message: 'Pollution record updated successfully' });
  } catch (err) {
    console.error('Error updating pollution record:', err);
    res.status(500).json({ error: 'Failed to update pollution record' });
  }
});

router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM pollution_records WHERE id = ?', [id]);
    res.json({ message: 'Pollution record deleted successfully' });
  } catch (err) {
    console.error('Error deleting pollution record:', err);
    res.status(500).json({ error: 'Failed to delete pollution record' });
  }
});

module.exports = router;
