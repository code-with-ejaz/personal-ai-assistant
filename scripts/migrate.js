const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('../db');
(async () => {
  const sql = await fs.readFile(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema is ready.');
  await pool.end();
})().catch((error) => { console.error(error); process.exit(1); });
