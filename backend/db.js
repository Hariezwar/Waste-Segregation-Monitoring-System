import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'waste_segregation.db');

export async function getDbConnection() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await getDbConnection();

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      target_segregation_rate REAL DEFAULT 85.0
    );

    CREATE TABLE IF NOT EXISTS collection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ward_id INTEGER,
      date TEXT NOT NULL,
      wet_waste_kg REAL NOT NULL,
      dry_waste_kg REAL NOT NULL,
      hazardous_waste_kg REAL NOT NULL,
      status TEXT NOT NULL, -- 'Fully Segregated', 'Partially Segregated', 'Mixed'
      supervisor_name TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trucks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_number TEXT NOT NULL UNIQUE,
      driver_name TEXT NOT NULL,
      status TEXT NOT NULL, -- 'Active', 'Idle', 'Maintenance'
      current_ward_id INTEGER,
      FOREIGN KEY (current_ward_id) REFERENCES wards(id) ON DELETE SET NULL
    );
  `);

  // Seed wards if empty
  const wardsCount = await db.get('SELECT COUNT(*) as count FROM wards');
  if (wardsCount.count === 0) {
    const wards = [
      { name: 'Ward 1 - Sector Alpha', target_segregation_rate: 90.0 },
      { name: 'Ward 2 - Sector Beta', target_segregation_rate: 85.0 },
      { name: 'Ward 3 - Sector Gamma', target_segregation_rate: 80.0 },
      { name: 'Ward 4 - Sector Delta', target_segregation_rate: 85.0 },
      { name: 'Ward 5 - Sector Epsilon', target_segregation_rate: 75.0 }
    ];
    for (const w of wards) {
      await db.run('INSERT INTO wards (name, target_segregation_rate) VALUES (?, ?)', [w.name, w.target_segregation_rate]);
    }
    console.log('Seeded Wards data.');
  }

  // Seed trucks if empty
  const trucksCount = await db.get('SELECT COUNT(*) as count FROM trucks');
  if (trucksCount.count === 0) {
    const trucks = [
      { truck_number: 'ULB-TRK-001', driver_name: 'John Doe', status: 'Active', current_ward_id: 1 },
      { truck_number: 'ULB-TRK-002', driver_name: 'Jane Smith', status: 'Active', current_ward_id: 2 },
      { truck_number: 'ULB-TRK-003', driver_name: 'Robert Johnson', status: 'Maintenance', current_ward_id: 3 },
      { truck_number: 'ULB-TRK-004', driver_name: 'Emily Davis', status: 'Active', current_ward_id: 4 },
      { truck_number: 'ULB-TRK-005', driver_name: 'Michael Brown', status: 'Idle', current_ward_id: null }
    ];
    for (const t of trucks) {
      await db.run('INSERT INTO trucks (truck_number, driver_name, status, current_ward_id) VALUES (?, ?, ?, ?)', [t.truck_number, t.driver_name, t.status, t.current_ward_id]);
    }
    console.log('Seeded Trucks data.');
  }

  // Seed collection logs if empty
  const logsCount = await db.get('SELECT COUNT(*) as count FROM collection_logs');
  if (logsCount.count === 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    const logs = [
      { ward_id: 1, date: today, wet_waste_kg: 450, dry_waste_kg: 350, hazardous_waste_kg: 10, status: 'Fully Segregated', supervisor_name: 'Alice Green', notes: 'Efficient sorting observed.' },
      { ward_id: 2, date: today, wet_waste_kg: 500, dry_waste_kg: 300, hazardous_waste_kg: 15, status: 'Partially Segregated', supervisor_name: 'Bob Miller', notes: 'Dry waste had some organic mixing.' },
      { ward_id: 3, date: today, wet_waste_kg: 350, dry_waste_kg: 200, hazardous_waste_kg: 25, status: 'Mixed', supervisor_name: 'Charlie Davis', notes: 'Lack of awareness in Sub-sector 3B.' },
      { ward_id: 4, date: today, wet_waste_kg: 600, dry_waste_kg: 420, hazardous_waste_kg: 5, status: 'Fully Segregated', supervisor_name: 'Diana Prince', notes: 'Excellent compliance from apartments.' },
      
      { ward_id: 1, date: yesterday, wet_waste_kg: 430, dry_waste_kg: 340, hazardous_waste_kg: 8, status: 'Fully Segregated', supervisor_name: 'Alice Green', notes: 'Routine collection.' },
      { ward_id: 2, date: yesterday, wet_waste_kg: 480, dry_waste_kg: 310, hazardous_waste_kg: 12, status: 'Partially Segregated', supervisor_name: 'Bob Miller', notes: 'Reminded households about segregation.' },
      { ward_id: 3, date: yesterday, wet_waste_kg: 360, dry_waste_kg: 210, hazardous_waste_kg: 20, status: 'Mixed', supervisor_name: 'Charlie Davis', notes: 'Need visual sorting poster distribution.' },
      { ward_id: 4, date: yesterday, wet_waste_kg: 580, dry_waste_kg: 400, hazardous_waste_kg: 8, status: 'Fully Segregated', supervisor_name: 'Diana Prince', notes: 'Steady flow.' },

      { ward_id: 1, date: twoDaysAgo, wet_waste_kg: 420, dry_waste_kg: 360, hazardous_waste_kg: 12, status: 'Fully Segregated', supervisor_name: 'Alice Green', notes: 'Completed on time.' },
      { ward_id: 2, date: twoDaysAgo, wet_waste_kg: 470, dry_waste_kg: 320, hazardous_waste_kg: 10, status: 'Partially Segregated', supervisor_name: 'Bob Miller', notes: 'Clean route.' },
      { ward_id: 3, date: twoDaysAgo, wet_waste_kg: 340, dry_waste_kg: 230, hazardous_waste_kg: 30, status: 'Mixed', supervisor_name: 'Charlie Davis', notes: 'High non-segregated load.' },
      { ward_id: 4, date: twoDaysAgo, wet_waste_kg: 590, dry_waste_kg: 410, hazardous_waste_kg: 6, status: 'Fully Segregated', supervisor_name: 'Diana Prince', notes: 'Good cooperation.' }
    ];

    for (const l of logs) {
      await db.run(
        `INSERT INTO collection_logs (ward_id, date, wet_waste_kg, dry_waste_kg, hazardous_waste_kg, status, supervisor_name, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.ward_id, l.date, l.wet_waste_kg, l.dry_waste_kg, l.hazardous_waste_kg, l.status, l.supervisor_name, l.notes]
      );
    }
    console.log('Seeded Collection Logs data.');
  }

  await db.close();
}
