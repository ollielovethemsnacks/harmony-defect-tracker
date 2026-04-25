import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import type { NeonHTTPDatabase } from 'drizzle-orm/neon-http';

// Initialize db - will throw at runtime if DATABASE_URL is not set
// This is safe because CI/CD always sets DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('WARNING: DATABASE_URL is not set. Database operations will fail.');
}

const sql = databaseUrl ? neon(databaseUrl) : null;
// Use type assertion to ensure db is always typed as drizzle instance
export const db = (sql ? drizzle(sql, { schema }) : null) as NeonHTTPDatabase<typeof schema>;

// Export getDb for compatibility with existing code
export function getDb() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return db;
}
