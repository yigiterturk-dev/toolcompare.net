import pool from './db';
import fs from 'fs';
import path from 'path';

async function setup() {
  try {
    if (!pool) {
      throw new Error("Database environment variables are not configured.");
    }
    console.log("Starting Database Setup...");

    // 1. Create Tools Table
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
    console.log("✅ Tools table ready.");

    // 2. Create Votes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_slug VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (tool_slug)
      )
    `);
    console.log("✅ Votes table ready.");

    // 3. Migrate Data from tools.json
    const toolsPath = path.join(process.cwd(), 'src', 'data', 'tools.json');
    if (fs.existsSync(toolsPath)) {
      const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
      console.log(`Found ${data.length} tools in JSON. Migrating...`);

      for (const tool of data) {
        await pool.query(`
          INSERT INTO tools (
            slug, name, category, iconName, color1, color2, ease, featuresScore, 
            basePrice, isFlat, websiteUrl, shortDescription, longDescription, 
            targetAudience, verdict, pros, cons, keyFeatures
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name)
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
      console.log("✅ Migration complete!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setup();
