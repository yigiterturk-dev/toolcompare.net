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

export async function queryStrict(
  sql: string,
  params?: Array<string | number | boolean | null | Date | Buffer>
) {
  if (!pool) throw new Error("Persistent database is not configured.");
  const [results] = await pool.execute(sql, params);
  return results;
}

export function isDatabaseConfigured() {
  return pool !== null;
}

export async function ensureGrowthTables() {
  if (!pool) return false;
  try {
    await ensureTables();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automation_jobs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(80) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'queued',
        payload JSON NOT NULL,
        result JSON,
        priority INT NOT NULL DEFAULT 50,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        quality_score INT,
        error_message TEXT,
        scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        finished_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX job_status_schedule (status, scheduled_at, priority)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_reviews (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        content_type VARCHAR(40) NOT NULL,
        content_key VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        quality_score INT NOT NULL DEFAULT 0,
        reasons JSON NOT NULL,
        payload JSON NOT NULL,
        source_count INT NOT NULL DEFAULT 0,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY content_review_key (content_type, content_key),
        INDEX review_status_score (status, quality_score)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_sources (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tool_slug VARCHAR(255) NOT NULL,
        source_type VARCHAR(40) NOT NULL DEFAULT 'official',
        source_url VARCHAR(1000) NOT NULL,
        source_title VARCHAR(255),
        confidence DECIMAL(4,3) NOT NULL DEFAULT 0.500,
        verified_at TIMESTAMP NULL,
        checksum VARCHAR(64),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY tool_source_url (tool_slug, source_url(500)),
        INDEX source_tool_slug (tool_slug)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automation_runs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        trigger_source VARCHAR(40) NOT NULL,
        status VARCHAR(32) NOT NULL,
        processed INT NOT NULL DEFAULT 0,
        succeeded INT NOT NULL DEFAULT 0,
        failed INT NOT NULL DEFAULT 0,
        summary JSON,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL
      )
    `);
    return true;
  } catch (error) {
    console.error("Growth table setup failed:", error);
    return false;
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
