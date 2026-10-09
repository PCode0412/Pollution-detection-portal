const db = require('../db');

/**
 * Calculates PPI (0-100) and status classification given an array of pollution records
 */
function calculatePPI(records) {
  if (!records || records.length === 0) {
    return { ppi: 0, status: 'Low', avgQty: 0, totalItems: 0, sampleCount: 0 };
  }

  const severityWeights = { 'Low': 1, 'Moderate': 2, 'High': 3, 'Critical': 4 };

  let totalQty = 0;
  let totalItems = 0;
  let totalSeverityScore = 0;

  records.forEach(r => {
    totalQty += Number(r.quantity_kg || 0);
    totalItems += Number(r.estimated_items || 0);
    const weight = severityWeights[r.severity] || 1;
    totalSeverityScore += weight;
  });

  const count = records.length;
  const avgQty = totalQty / count;
  const avgSeverityWeight = totalSeverityScore / count;

  // Severity Weight Component: 1 to 4 -> 12.5 to 50
  const severityComponent = (avgSeverityWeight / 4) * 50;

  // Quantity Component: 0 to 100 kg -> 0 to 50
  const quantityComponent = Math.min(50, (avgQty / 80) * 50);

  const baseScore = severityComponent + quantityComponent;

  // Calculate multi-year trend adjustment if records span > 1 year
  const yearGrouped = {};
  records.forEach(r => {
    if (!yearGrouped[r.year]) yearGrouped[r.year] = [];
    yearGrouped[r.year].push(r);
  });

  const sortedYears = Object.keys(yearGrouped).map(Number).sort((a, b) => a - b);
  let trendAdjustment = 0;

  if (sortedYears.length >= 2) {
    const earliestYr = sortedYears[0];
    const latestYr = sortedYears[sortedYears.length - 1];

    const earliestRecords = yearGrouped[earliestYr];
    const latestRecords = yearGrouped[latestYr];

    const earliestAvg = earliestRecords.reduce((s, r) => s + r.quantity_kg, 0) / earliestRecords.length;
    const latestAvg = latestRecords.reduce((s, r) => s + r.quantity_kg, 0) / latestRecords.length;

    const slope = (latestAvg - earliestAvg) / Math.max(1, latestYr - earliestYr);
    trendAdjustment = Math.min(10, Math.max(-10, slope * 2));
  }

  let finalPPI = Math.round(baseScore + trendAdjustment);
  finalPPI = Math.min(100, Math.max(0, finalPPI));

  let status = 'Low';
  if (finalPPI >= 76) status = 'Critical';
  else if (finalPPI >= 51) status = 'High';
  else if (finalPPI >= 26) status = 'Moderate';

  return {
    ppi: finalPPI,
    status,
    avgQty: parseFloat(avgQty.toFixed(2)),
    totalQty: parseFloat(totalQty.toFixed(2)),
    totalItems,
    sampleCount: count
  };
}

/**
 * Classifies an observation point into a Hotspot category based on 2022-2026 record history
 */
function classifyHotspot(yearlyMetrics) {
  const years = Object.keys(yearlyMetrics).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return 'Stable Area';

  const latestYear = years[years.length - 1];
  const earliestYear = years[0];
  const latestPPI = yearlyMetrics[latestYear] || 0;
  const earliestPPI = yearlyMetrics[earliestYear] || 0;

  const avgPPI = years.reduce((sum, y) => sum + (yearlyMetrics[y] || 0), 0) / years.length;
  const ppiChange = latestPPI - earliestPPI;

  if (avgPPI >= 65 && latestPPI >= 60) {
    return 'Persistent / Critical Hotspot';
  } else if (ppiChange >= 12) {
    return 'Emerging Hotspot';
  } else if (ppiChange <= -12) {
    return 'Improving Area';
  } else {
    return 'Stable Area';
  }
}

module.exports = {
  calculatePPI,
  classifyHotspot
};
