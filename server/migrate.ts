
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    // Test database connection first
    try {
      await db.execute(sql`SELECT 1`);
      console.log("✅ Database connection successful");
    } catch (connectionError) {
      console.warn("⚠️ Database connection failed, skipping migrations:", connectionError.message);
      return;
    }

    // Create extensions if needed
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create users table with all necessary columns
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        role_id INTEGER,
        permissions JSON DEFAULT '{"assets":{"view":true,"edit":false,"add":false},"components":{"view":true,"edit":false,"add":false},"accessories":{"view":true,"edit":false,"add":false},"consumables":{"view":true,"edit":false,"add":false},"licenses":{"view":true,"edit":false,"add":false},"users":{"view":false,"edit":false,"add":false},"reports":{"view":true,"edit":false,"add":false},"vmMonitoring":{"view":true,"edit":false,"add":false},"networkDiscovery":{"view":true,"edit":false,"add":false},"bitlockerKeys":{"view":false,"edit":false,"add":false},"admin":{"view":false,"edit":false,"add":false}}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        asset_tag TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        condition TEXT NOT NULL DEFAULT 'Good',
        purchase_date TEXT,
        purchase_cost TEXT,
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        notes TEXT,
        knox_id TEXT,
        ip_address TEXT,
        mac_address TEXT,
        os_type TEXT,
        assigned_to INTEGER REFERENCES users(id),
        checkout_date TEXT,
        expected_checkin_date TEXT,
        finance_updated BOOLEAN DEFAULT FALSE,
        department TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create components table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS components (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        date_released TEXT,
        date_returned TEXT,
        released_by TEXT,
        returned_to TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create accessories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accessories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        assigned_to INTEGER REFERENCES users(id),
        knox_id TEXT,
        date_released TEXT,
        date_returned TEXT,
        released_by TEXT,
        returned_to TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create consumables table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS consumables (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'available',
        location TEXT,
        model_number TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create licenses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        key TEXT NOT NULL,
        seats TEXT,
        assigned_seats INTEGER DEFAULT 0,
        company TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        expiration_date TEXT,
        purchase_cost TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        assigned_to INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create activities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        user_id INTEGER REFERENCES users(id),
        timestamp TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        site_name TEXT DEFAULT 'SRPH-MIS',
        site_url TEXT DEFAULT 'https://localhost:3000',
        theme TEXT DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings if not exists
    await db.execute(sql`
      INSERT INTO settings (site_name, site_url, theme)
      SELECT 'SRPH-MIS', 'https://localhost:3000', 'light'
      WHERE NOT EXISTS (SELECT 1 FROM settings)
    `);

    console.log("✅ Database migrations completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}
