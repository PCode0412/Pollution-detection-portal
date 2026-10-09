const express = require('express');
const db = require('../db');
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/cleanups - Fetch cleanup drives
router.get('/', async (req, res) => {
  try {
    const { location_id } = req.query;
    let queryStr = `
      SELECT cr.*, op.name as location_name, wb.name as water_body_name
      FROM cleanup_records cr
      JOIN observation_points op ON cr.observation_point_id = op.id
      JOIN water_bodies wb ON op.water_body_id = wb.id
    `;
    const params = [];

    if (location_id) {
      queryStr += ' WHERE cr.observation_point_id = ?';
      params.push(location_id);
    }

    queryStr += ' ORDER BY cr.date DESC';
    const cleanups = await db.query(queryStr, params);
    res.json(cleanups);
  } catch (err) {
    console.error('Error fetching cleanups:', err);
    res.status(500).json({ error: 'Failed to retrieve cleanup records' });
  }
});

// Admin CRUD for cleanups
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { observation_point_id, date, waste_collected_kg, volunteers_count, organizer, description } = req.body;
    if (!observation_point_id || !date || waste_collected_kg == null || !organizer) {
      return res.status(400).json({ error: 'Missing required cleanup fields' });
    }

    const result = await db.query(`
      INSERT INTO cleanup_records (observation_point_id, date, waste_collected_kg, volunteers_count, organizer, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      observation_point_id,
      date,
      parseFloat(waste_collected_kg),
      parseInt(volunteers_count || 0, 10),
      organizer,
      description || ''
    ]);

    res.status(201).json({ message: 'Cleanup record created', id: result.insertId });
  } catch (err) {
    console.error('Error creating cleanup record:', err);
    res.status(500).json({ error: 'Failed to create cleanup record' });
  }
});

router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM cleanup_records WHERE id = ?', [id]);
    res.json({ message: 'Cleanup record deleted successfully' });
  } catch (err) {
    console.error('Error deleting cleanup record:', err);
    res.status(500).json({ error: 'Failed to delete cleanup record' });
  }
});

module.exports = router;
