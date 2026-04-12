import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT } from '../paths.js';
import * as schema from './schema.js';
import { backfillLastUsedAt } from './api-keys.js';

const thepopebotDb = process.env.DATABASE_PATH || path.join(PROJECT_ROOT, 'data/db/thepopebot.sqlite');

let _db = null;

/**
 * Get or create the Drizzle database instance (lazy singleton).
 * Lazy loads better-sqlite3 to avoid native module binding issues in Next.js.
 * @returns {import('drizzle-orm/better-sqlite3').BetterSQLite3Database}
 */
export function getDb() {
  if (!_db) {
    // Use require() for synchronous runtime loading (not compile-time)
    const Database = require('better-sqlite3');
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    
    // Ensure database directory exists
    const dbDir = path.dirname(thepopebotDb);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const sqlite = new Database(thepopebotDb);
    sqlite.pragma('journal_mode = WAL');
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

/**
 * Initialize the database — apply pending migrations.
 * Called from instrumentation.js at server startup.
 * Uses Drizzle Kit migrations from the package's drizzle/ folder.
 */
export function initDatabase() {
  const dbDir = path.dirname(thepopebotDb);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Use require() for runtime loading
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const { migrate } = require('drizzle-orm/better-sqlite3/migrator');

  const sqlite = new Database(thepopebotDb);
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });

  // Resolve migrations folder from the installed package.
  // First try PROJECT_ROOT/drizzle (local development or monorepo)
  // Then fall back to node_modules/thepopebot/drizzle (npm package)
  let migrationsFolder = path.join(PROJECT_ROOT, 'drizzle');
  if (!fs.existsSync(migrationsFolder)) {
    migrationsFolder = path.join(PROJECT_ROOT, 'node_modules', 'thepopebot', 'drizzle');
  }
  
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found at ${migrationsFolder}`);
  }

  migrate(db, { migrationsFolder });

  sqlite.close();

  // Force re-creation of drizzle instance on next getDb() call
  _db = null;

  // Backfill lastUsedAt column from JSON for existing api_key rows
  try {
    backfillLastUsedAt();
  } catch {
    // Non-fatal: backfill is informational
  }
}
