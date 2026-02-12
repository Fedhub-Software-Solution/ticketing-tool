/**
 * Run SQL files using the pg client (CommonJS). Use when psql is not on PATH (e.g. Windows).
 * Usage: node scripts/run-sql.cjs sql/01_schema.sql [sql/02_seed.sql ...]
 */
require('dotenv').config();
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/ticketing_tool';
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.log('Usage: node scripts/run-sql.cjs <file1.sql> [file2.sql ...]');
    console.log('Example: node scripts/run-sql.cjs sql/01_schema.sql sql/02_seed.sql');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database.');
    for (const file of files) {
      const filePath = path.isAbsolute(file) ? file : path.join(rootDir, file);
      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log('Running', file, '...');
      await client.query(sql);
      console.log('Done:', file);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
