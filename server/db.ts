import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not found! Using fallback configuration.");
  console.warn("Please set up PostgreSQL database through Replit's Database tab.");
  console.warn("Go to Database tab → Create a database to fix this issue.");
  
  // Fallback to in-memory storage for development
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/fallback_db";
}

console.log("🔗 Connecting to database:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export const db = drizzle(pool, { schema });
