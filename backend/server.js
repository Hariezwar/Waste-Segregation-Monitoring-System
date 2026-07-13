import express from 'express';
import cors from 'cors';
import { getDbConnection, initDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database on startup
initDb()
  .then(() => console.log('Database initialized successfully.'))
  .catch(err => console.error('Database initialization failed:', err));

// --- API ROUTES ---

// 1. Get Wards with their metrics
app.get('/api/wards', async (req, res) => {
  try {
    const db = await getDbConnection();
    
    // We fetch wards and calculate their average segregation rate from logs.
    // If no logs, actual segregation rate is defaulted to 0.
    const wards = await db.all(`
      SELECT 
        w.id, 
        w.name, 
        w.target_segregation_rate,
        COUNT(l.id) as total_logs,
        COALESCE(SUM(l.wet_waste_kg), 0) as total_wet,
        COALESCE(SUM(l.dry_waste_kg), 0) as total_dry,
        COALESCE(SUM(l.hazardous_waste_kg), 0) as total_hazardous,
        CASE 
          WHEN COUNT(l.id) = 0 THEN 0.0
          ELSE ROUND(
            (SUM(CASE WHEN l.status = 'Fully Segregated' THEN 1.0 WHEN l.status = 'Partially Segregated' THEN 0.6 ELSE 0.2 END) / COUNT(l.id)) * 100, 
            1
          )
        END as actual_segregation_rate
      FROM wards w
      LEFT JOIN collection_logs l ON w.id = l.ward_id
      GROUP BY w.id
    `);
    
    await db.close();
    res.json(wards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Logs (joined with ward name)
app.get('/api/logs', async (req, res) => {
  try {
    const db = await getDbConnection();
    const logs = await db.all(`
      SELECT 
        l.id, 
        l.date, 
        l.wet_waste_kg, 
        l.dry_waste_kg, 
        l.hazardous_waste_kg, 
        l.status, 
        l.supervisor_name, 
        l.notes,
        w.name as ward_name,
        w.id as ward_id
      FROM collection_logs l
      JOIN wards w ON l.ward_id = w.id
      ORDER BY l.date DESC, l.id DESC
    `);
    await db.close();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create a Log
app.post('/api/logs', async (req, res) => {
  const { ward_id, date, wet_waste_kg, dry_waste_kg, hazardous_waste_kg, status, supervisor_name, notes } = req.body;
  
  if (!ward_id || !date || wet_waste_kg === undefined || dry_waste_kg === undefined || hazardous_waste_kg === undefined || !status || !supervisor_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = await getDbConnection();
    const result = await db.run(
      `INSERT INTO collection_logs (ward_id, date, wet_waste_kg, dry_waste_kg, hazardous_waste_kg, status, supervisor_name, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ward_id, date, wet_waste_kg, dry_waste_kg, hazardous_waste_kg, status, supervisor_name, notes || '']
    );
    
    const newLog = await db.get(`
      SELECT l.*, w.name as ward_name 
      FROM collection_logs l 
      JOIN wards w ON l.ward_id = w.id 
      WHERE l.id = ?`, 
      [result.lastID]
    );

    await db.close();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Trucks
app.get('/api/trucks', async (req, res) => {
  try {
    const db = await getDbConnection();
    const trucks = await db.all(`
      SELECT 
        t.id, 
        t.truck_number, 
        t.driver_name, 
        t.status, 
        t.current_ward_id,
        w.name as ward_name
      FROM trucks t
      LEFT JOIN wards w ON t.current_ward_id = w.id
    `);
    await db.close();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update Truck Status or Ward assignment
app.put('/api/trucks/:id', async (req, res) => {
  const { id } = req.params;
  const { status, current_ward_id } = req.body;

  try {
    const db = await getDbConnection();
    await db.run(
      `UPDATE trucks SET status = ?, current_ward_id = ? WHERE id = ?`,
      [status, current_ward_id || null, id]
    );
    const updatedTruck = await db.get(`
      SELECT t.*, w.name as ward_name 
      FROM trucks t 
      LEFT JOIN wards w ON t.current_ward_id = w.id 
      WHERE t.id = ?`, 
      [id]
    );
    await db.close();
    res.json(updatedTruck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Global/Summary Stats
app.get('/api/stats', async (req, res) => {
  try {
    const db = await getDbConnection();

    // Sum waste metrics
    const wasteSum = await db.get(`
      SELECT 
        COALESCE(SUM(wet_waste_kg), 0) as total_wet,
        COALESCE(SUM(dry_waste_kg), 0) as total_dry,
        COALESCE(SUM(hazardous_waste_kg), 0) as total_hazardous,
        COUNT(id) as total_entries
      FROM collection_logs
    `);

    // Calculate segregation efficiency
    const segregationRateQuery = await db.get(`
      SELECT 
        CASE 
          WHEN COUNT(id) = 0 THEN 0.0
          ELSE ROUND(
            (SUM(CASE WHEN status = 'Fully Segregated' THEN 1.0 WHEN status = 'Partially Segregated' THEN 0.6 ELSE 0.2 END) / COUNT(id)) * 100, 
            1
          )
        END as efficiency_rate
      FROM collection_logs
    `);

    // Fleet distribution
    const fleetStats = await db.all(`
      SELECT status, COUNT(*) as count 
      FROM trucks 
      GROUP BY status
    `);

    const fleet = {
      Active: 0,
      Idle: 0,
      Maintenance: 0,
      Total: 0
    };
    fleetStats.forEach(f => {
      fleet[f.status] = f.count;
      fleet.Total += f.count;
    });

    // Ward Leaderboard
    const leaderboard = await db.all(`
      SELECT 
        w.id,
        w.name,
        ROUND(
          (SUM(CASE WHEN l.status = 'Fully Segregated' THEN 1.0 WHEN l.status = 'Partially Segregated' THEN 0.6 ELSE 0.2 END) / COUNT(l.id)) * 100, 
          1
        ) as segregation_rate
      FROM wards w
      JOIN collection_logs l ON w.id = l.ward_id
      GROUP BY w.id
      ORDER BY segregation_rate DESC
    `);

    // Charts: Waste Collected over Time (last 7 days of entries)
    const chartData = await db.all(`
      SELECT 
        date,
        SUM(wet_waste_kg) as wet,
        SUM(dry_waste_kg) as dry,
        SUM(hazardous_waste_kg) as hazardous
      FROM collection_logs
      GROUP BY date
      ORDER BY date ASC
      LIMIT 10
    `);

    await db.close();
    res.json({
      waste: {
        wet: wasteSum.total_wet,
        dry: wasteSum.total_dry,
        hazardous: wasteSum.total_hazardous,
        total: wasteSum.total_wet + wasteSum.total_dry + wasteSum.total_hazardous
      },
      efficiency: segregationRateQuery.efficiency_rate,
      fleet,
      leaderboard,
      chartData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
