const express = require('express');
const db = require('../db');
const { calculatePPI, classifyHotspot } = require('../services/analyticsService');

const router = express.Router();

// GET /api/analytics/overview - Overall Chennai dashboard summary statistics
router.get('/overview', async (req, res) => {
  try {
    const { year, water_body_id } = req.query;

    const allRecords = await db.query('SELECT * FROM pollution_records');
    const plasticTypes = await db.query('SELECT * FROM plastic_types');
    const locations = await db.query('SELECT * FROM observation_points');
    const waterBodies = await db.query('SELECT * FROM water_bodies');

    // Filter records
    let filteredRecords = allRecords;

    if (year) {
      filteredRecords = filteredRecords.filter(r => Number(r.year) === Number(year));
    }

    if (water_body_id) {
      const targetLocIds = locations.filter(l => l.water_body_id === Number(water_body_id)).map(l => l.id);
      filteredRecords = filteredRecords.filter(r => targetLocIds.includes(r.observation_point_id));
    }

    const overallPpiMetrics = calculatePPI(filteredRecords);

    // Map plastic_type_id -> plastic type name
    const ptIdToNameMap = {};
    plasticTypes.forEach(pt => {
      ptIdToNameMap[pt.id] = pt.name;
    });

    // Group breakdown by category name
    const ptNameGrouped = {};
    filteredRecords.forEach(r => {
      const typeName = ptIdToNameMap[r.plastic_type_id] || 'Other Plastic';
      if (!ptNameGrouped[typeName]) {
        ptNameGrouped[typeName] = { name: typeName, total_kg: 0, total_items: 0, record_count: 0 };
      }
      ptNameGrouped[typeName].total_kg += Number(r.quantity_kg || 0);
      ptNameGrouped[typeName].total_items += Number(r.estimated_items || 0);
      ptNameGrouped[typeName].record_count++;
    });

    const plasticTypeBreakdown = Object.values(ptNameGrouped)
      .map(item => ({
        ...item,
        total_kg: parseFloat(item.total_kg.toFixed(1))
      }))
      .sort((a, b) => b.total_kg - a.total_kg);

    // Severity breakdown
    const severityBreakdown = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    filteredRecords.forEach(r => {
      if (severityBreakdown[r.severity] !== undefined) {
        severityBreakdown[r.severity]++;
      }
    });

    res.json({
      overallPPI: overallPpiMetrics.ppi,
      status: overallPpiMetrics.status,
      totalWasteKg: overallPpiMetrics.totalQty,
      totalEstimatedItems: overallPpiMetrics.totalItems,
      totalRecords: filteredRecords.length,
      waterBodiesCount: waterBodies.length,
      observationPointsCount: locations.length,
      plasticTypeBreakdown,
      severityBreakdown
    });
  } catch (err) {
    console.error('Error fetching analytics overview:', err);
    res.status(500).json({ error: 'Failed to compute analytics overview' });
  }
});

// GET /api/analytics/trends - Yearly historical trends (2022-2026)
router.get('/trends', async (req, res) => {
  try {
    const { water_body_id } = req.query;

    const allRecords = await db.query('SELECT * FROM pollution_records');
    const locations = await db.query('SELECT * FROM observation_points');
    const waterBodies = await db.query('SELECT * FROM water_bodies');

    const locToWbMap = {};
    locations.forEach(loc => {
      const wb = waterBodies.find(w => w.id === loc.water_body_id);
      if (wb) locToWbMap[loc.id] = wb;
    });

    const years = [2022, 2023, 2024, 2025, 2026];

    const targetWaterBodies = water_body_id
      ? waterBodies.filter(w => w.id === Number(water_body_id))
      : waterBodies;

    const trendData = years.map(yr => {
      const yearRecords = allRecords.filter(r => Number(r.year) === yr);
      const yearObj = { year: yr };

      targetWaterBodies.forEach(wb => {
        const wbYearRecords = yearRecords.filter(r => locToWbMap[r.observation_point_id]?.id === wb.id);
        yearObj[wb.name] = calculatePPI(wbYearRecords).ppi;
      });

      yearObj['Overall Chennai'] = calculatePPI(yearRecords).ppi;
      return yearObj;
    });

    res.json(trendData);
  } catch (err) {
    console.error('Error fetching trends:', err);
    res.status(500).json({ error: 'Failed to compute trends' });
  }
});

// GET /api/analytics/hotspots - Hotspot identification & classification breakdown
router.get('/hotspots', async (req, res) => {
  try {
    const locations = await db.query('SELECT * FROM observation_points');
    const waterBodies = await db.query('SELECT * FROM water_bodies');
    const allRecords = await db.query('SELECT * FROM pollution_records');

    const categorized = {
      'Persistent / Critical Hotspot': [],
      'Emerging Hotspot': [],
      'Improving Area': [],
      'Stable Area': []
    };

    for (const loc of locations) {
      const wb = waterBodies.find(w => w.id === loc.water_body_id) || {};
      const locRecords = allRecords.filter(r => r.observation_point_id === loc.id);

      const metrics = calculatePPI(locRecords);

      const yearGroups = {};
      locRecords.forEach(r => {
        if (!yearGroups[r.year]) yearGroups[r.year] = [];
        yearGroups[r.year].push(r);
      });

      const yearlyPpi = {};
      Object.keys(yearGroups).forEach(yr => {
        yearlyPpi[yr] = calculatePPI(yearGroups[yr]).ppi;
      });

      const category = classifyHotspot(yearlyPpi);

      const locSummary = {
        id: loc.id,
        name: loc.name,
        waterBodyName: wb.name,
        waterBodyType: wb.type,
        latitude: loc.latitude,
        longitude: loc.longitude,
        currentPPI: metrics.ppi,
        status: metrics.status,
        avgQtyKg: metrics.avgQty,
        yearlyPpi,
        category
      };

      if (categorized[category]) {
        categorized[category].push(locSummary);
      } else {
        categorized['Stable Area'].push(locSummary);
      }
    }

    res.json(categorized);
  } catch (err) {
    console.error('Error fetching hotspots:', err);
    res.status(500).json({ error: 'Failed to compute hotspots' });
  }
});

module.exports = router;
