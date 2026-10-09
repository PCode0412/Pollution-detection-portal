const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let dbType = 'mysql';
let pool = null;

// Lightweight JSON file persistence fallback if MySQL server connection is unavailable
const jsonDbPath = path.join(__dirname, 'pollution_store.json');
let jsonStore = {
  administrators: [],
  water_bodies: [],
  observation_points: [],
  plastic_types: [],
  pollution_records: [],
  cleanup_records: []
};

function saveJsonStore() {
  fs.writeFileSync(jsonDbPath, JSON.stringify(jsonStore, null, 2), 'utf-8');
}

function loadJsonStore() {
  if (fs.existsSync(jsonDbPath)) {
    try {
      jsonStore = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
    } catch (e) {
      console.error('[DB] Failed reading json store, resetting...');
    }
  }
}

async function initDbConnection() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const database = process.env.DB_NAME || 'plastic_pollution_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  try {
    const tempConnection = await mysql.createConnection({
      host, user, password, port
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await tempConnection.end();

    pool = mysql.createPool({
      host, user, password, database, port,
      waitForConnections: true,
      connectionLimit: 10
    });

    const conn = await pool.getConnection();
    conn.release();
    dbType = 'mysql';
    console.log(`[DB] Connected successfully to MySQL database "${database}" at ${host}:${port}`);
  } catch (err) {
    console.warn(`[DB] MySQL connection attempt failed (${err.message}). Activating JSON File Engine fallback.`);
    dbType = 'json';
    loadJsonStore();
  }
}

async function query(sql, params = []) {
  if (!pool && dbType === 'mysql') {
    await initDbConnection();
  }

  if (dbType === 'mysql') {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  // --- JSON File Engine Query Emulation ---
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // Drop Table / Set Foreign Key
  if (cleanSql.toUpperCase().startsWith('DROP TABLE') || cleanSql.toUpperCase().startsWith('SET FOREIGN')) {
    const tbl = cleanSql.split(' ')[3]?.replace(';', '').trim();
    if (tbl && jsonStore[tbl]) jsonStore[tbl] = [];
    saveJsonStore();
    return [];
  }

  // Create Table
  if (cleanSql.toUpperCase().startsWith('CREATE TABLE')) {
    const match = cleanSql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
    if (match && match[1]) {
      const tbl = match[1];
      if (!jsonStore[tbl]) jsonStore[tbl] = [];
    }
    saveJsonStore();
    return [];
  }

  // INSERT INTO
  if (cleanSql.toUpperCase().startsWith('INSERT INTO')) {
    const match = cleanSql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (match) {
      const tbl = match[1];
      const fields = match[2].split(',').map(f => f.trim());
      if (!jsonStore[tbl]) jsonStore[tbl] = [];
      
      const newRow = { id: jsonStore[tbl].length + 1 };
      fields.forEach((f, idx) => {
        newRow[f] = params[idx];
      });

      jsonStore[tbl].push(newRow);
      saveJsonStore();
      return { insertId: newRow.id, affectedRows: 1 };
    }
  }

  // UPDATE
  if (cleanSql.toUpperCase().startsWith('UPDATE')) {
    const match = cleanSql.match(/UPDATE (\w+) SET (.+) WHERE id = \?/i);
    if (match) {
      const tbl = match[1];
      const setters = match[2].split(',').map(s => s.trim().split('=')[0].trim());
      const targetId = params[params.length - 1];

      if (jsonStore[tbl]) {
        const row = jsonStore[tbl].find(r => r.id === Number(targetId));
        if (row) {
          setters.forEach((f, idx) => {
            row[f] = params[idx];
          });
          saveJsonStore();
          return { affectedRows: 1 };
        }
      }
    }
    return { affectedRows: 0 };
  }

  // DELETE
  if (cleanSql.toUpperCase().startsWith('DELETE FROM')) {
    const match = cleanSql.match(/DELETE FROM (\w+) WHERE id = \?/i);
    if (match) {
      const tbl = match[1];
      const targetId = params[0];
      if (jsonStore[tbl]) {
        const initLen = jsonStore[tbl].length;
        jsonStore[tbl] = jsonStore[tbl].filter(r => r.id !== Number(targetId));
        saveJsonStore();
        return { affectedRows: initLen - jsonStore[tbl].length };
      }
    }
  }

  // SELECT Queries
  if (cleanSql.toUpperCase().startsWith('SELECT')) {
    // Select count
    if (cleanSql.toUpperCase().includes('COUNT(*) AS COUNT FROM WATER_BODIES')) {
      return [{ count: jsonStore.water_bodies.length }];
    }
    if (cleanSql.toUpperCase().includes('COUNT(*) AS COUNT FROM OBSERVATION_POINTS')) {
      return [{ count: jsonStore.observation_points.length }];
    }

    // Administrators check
    if (cleanSql.includes('FROM administrators WHERE email = ?')) {
      return jsonStore.administrators.filter(a => a.email === params[0]);
    }

    // Water Bodies list or detail
    if (cleanSql.includes('FROM water_bodies WHERE id = ?')) {
      return jsonStore.water_bodies.filter(w => w.id === Number(params[0]));
    }
    if (cleanSql.includes('FROM water_bodies')) {
      return [...jsonStore.water_bodies];
    }

    // Observation Points
    if (cleanSql.includes('FROM observation_points op JOIN water_bodies wb')) {
      let res = jsonStore.observation_points.map(op => {
        const wb = jsonStore.water_bodies.find(w => w.id === op.water_body_id) || {};
        return { ...op, water_body_name: wb.name, water_body_type: wb.type };
      });
      if (params.length > 0) res = res.filter(r => r.water_body_id === Number(params[0]));
      return res;
    }
    if (cleanSql.includes('FROM observation_points WHERE water_body_id = ?')) {
      return jsonStore.observation_points.filter(op => op.water_body_id === Number(params[0]));
    }
    if (cleanSql.includes('FROM observation_points')) {
      return [...jsonStore.observation_points];
    }

    // Plastic types
    if (cleanSql.includes('FROM plastic_types')) {
      return [...jsonStore.plastic_types];
    }

    // Pollution records
    if (cleanSql.includes('FROM pollution_records')) {
      let res = jsonStore.pollution_records.map(pr => {
        const op = jsonStore.observation_points.find(o => o.id === pr.observation_point_id) || {};
        const wb = jsonStore.water_bodies.find(w => w.id === op.water_body_id) || {};
        const pt = jsonStore.plastic_types.find(p => p.id === pr.plastic_type_id) || {};
        return {
          ...pr,
          location_name: op.name,
          location_lat: op.latitude,
          location_lng: op.longitude,
          water_body_id: wb.id,
          water_body_name: wb.name,
          water_body_type: wb.type,
          plastic_type_name: pt.name,
          hazard_weight: pt.hazard_weight
        };
      });

      // Filter handling
      if (cleanSql.includes('WHERE observation_point_id = ?')) {
        res = res.filter(r => r.observation_point_id === Number(params[0]));
      } else if (cleanSql.includes('WHERE observation_point_id IN')) {
        res = res.filter(r => params.map(Number).includes(r.observation_point_id));
      }

      // Year filter
      if (params.length === 1 && typeof params[0] === 'number') {
        if (cleanSql.includes('year = ?')) res = res.filter(r => r.year === params[0]);
      }

      return res;
    }

    // Cleanups
    if (cleanSql.includes('FROM cleanup_records')) {
      let res = jsonStore.cleanup_records.map(cr => {
        const op = jsonStore.observation_points.find(o => o.id === cr.observation_point_id) || {};
        const wb = jsonStore.water_bodies.find(w => w.id === op.water_body_id) || {};
        return { ...cr, location_name: op.name, water_body_name: wb.name };
      });
      if (params.length > 0) res = res.filter(r => r.observation_point_id === Number(params[0]));
      return res;
    }
  }

  return [];
}

function getDbType() {
  return dbType;
}

module.exports = {
  initDbConnection,
  query,
  getDbType
};
