// Database Service - Optional database for storing video metadata
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to import better-sqlite3, but handle gracefully if not available
let Database = null;
try {
  const sqlite3Module = await import('better-sqlite3');
  Database = sqlite3Module.default;
} catch (error) {
  // better-sqlite3 is optional - app works without it
  Database = null;
}

let db = null;

const initDatabase = () => {
  if (!Database) {
    throw new Error(
      'better-sqlite3 is not installed. ' +
      'Install it with: npm install better-sqlite3\n' +
      'Or set USE_DATABASE=false to run without database.'
    );
  }
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  db = new Database(dbPath);
  
  // Create videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      originalName TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL,
      mimetype TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      captions TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_filename ON videos(filename);
    CREATE INDEX IF NOT EXISTS idx_uploadedAt ON videos(uploadedAt);
  `);
};

export const createDatabaseService = () => {
  initDatabase();
  return {
    saveVideo: async (videoData) => {
      const stmt = db.prepare(`
        INSERT INTO videos (filename, originalName, path, size, mimetype, uploadedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        videoData.filename,
        videoData.originalName,
        videoData.path,
        videoData.size,
        videoData.mimetype,
        videoData.uploadedAt || new Date().toISOString()
      );

      return result.lastInsertRowid;
    },

    getVideo: async (filename) => {
      const stmt = db.prepare('SELECT * FROM videos WHERE filename = ?');
      return stmt.get(filename);
    },

    updateCaptions: async (filename, captions) => {
      const stmt = db.prepare('UPDATE videos SET captions = ? WHERE filename = ?');
      stmt.run(JSON.stringify(captions), filename);
    },

    getAllVideos: async (limit = 50) => {
      const stmt = db.prepare('SELECT * FROM videos ORDER BY uploadedAt DESC LIMIT ?');
      return stmt.all(limit);
    },

    deleteVideo: async (filename) => {
      const stmt = db.prepare('DELETE FROM videos WHERE filename = ?');
      return stmt.run(filename);
    },

    close: () => {
      if (db) {
        db.close();
      }
    }
  };
};

