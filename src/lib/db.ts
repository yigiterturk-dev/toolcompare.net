import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool: any = null;

// Initialize connection only if env vars exist
if (process.env.DB_NAME && process.env.DB_USER) {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });
}

export async function query(sql: string, params?: any[]) {
  if (!pool) return null;
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error("DB Query Error:", error);
    return null;
  }
}

// Check and Setup Tables
export async function ensureTables() {
  if (!pool) return false;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        iconName VARCHAR(100),
        color1 VARCHAR(50),
        color2 VARCHAR(50),
        ease INT DEFAULT 90,
        featuresScore INT DEFAULT 90,
        basePrice DECIMAL(10, 2) DEFAULT 0,
        isFlat BOOLEAN DEFAULT FALSE,
        websiteUrl VARCHAR(500),
        shortDescription TEXT,
        longDescription TEXT,
        targetAudience TEXT,
        verdict TEXT,
        pros JSON,
        cons JSON,
        keyFeatures JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if empty and migrate if needed
    const [rows] = await pool.query('SELECT count(*) as count FROM tools');
    if (rows[0].count === 0) {
      console.log("DB is empty, migrating from JSON...");
      const toolsPath = path.join(process.cwd(), 'src', 'data', 'tools.json');
      if (fs.existsSync(toolsPath)) {
        const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
        for (const tool of data) {
          await pool.query(`
            INSERT IGNORE INTO tools (
              slug, name, category, iconName, color1, color2, ease, featuresScore, 
              basePrice, isFlat, websiteUrl, shortDescription, longDescription, 
              targetAudience, verdict, pros, cons, keyFeatures
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            tool.slug, tool.name, tool.category, tool.iconName || 'Zap', 
            tool.color1 || '#6366f1', tool.color2 || '#a855f7', 
            tool.ease || 90, tool.featuresScore || 90, 
            tool.basePrice || 0, tool.isFlat || false, 
            tool.websiteUrl || '', tool.shortDescription || '', 
            tool.longDescription || '', tool.targetAudience || '', 
            tool.verdict || '', 
            JSON.stringify(tool.pros || []), 
            JSON.stringify(tool.cons || []), 
            JSON.stringify(tool.keyFeatures || tool.features || [])
          ]);
        }
      }
    }
    return true;
  } catch (error) {
    console.error("Table Setup Failed:", error);
    return false;
  }
}

export default pool;
