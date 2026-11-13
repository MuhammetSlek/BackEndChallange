/**
 * scripts/export-db.js -- DATABASE FILES FOR THE SUBMISSION
 *
 * Run it with:  npm run export:db
 *
 * The brief requires the database files to be submitted. The usual tool is
 * mongodump, which belongs to "MongoDB Database Tools" and is not installed
 * here, so this script reads the collections with the driver and writes them
 * as JSON (one file per collection) into dump/.
 *
 * Those JSON files are also importable in Compass:
 *   select a collection -> Add Data -> Import File -> JSON
 * and restorable with the driver if you ever need to rebuild the database.
 */
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const OUT_DIR = path.join(__dirname, '..', 'dump');

(async () => {
  await connectDB();

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Remove JSON from a previous run so the dump always matches the live database
  // (a stale file for a dropped collection is worse than no file).
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith('.json')) fs.rmSync(path.join(OUT_DIR, file));
  }

  const manifest = {
    database: mongoose.connection.name,
    exportedAt: new Date().toISOString(),
    collections: {},
  };

  const SKIP = new Set(['sessions']); // infrastructure, not application data

  for (const { name } of collections) {
    if (SKIP.has(name) || name.startsWith('__')) {
      console.log(`  ${name}: skipped`);
      continue;
    }

    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(OUT_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), 'utf8');

    manifest.collections[name] = docs.length;
    console.log(`  ${name}: ${docs.length} document(s) -> dump/${name}.json`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nExport complete: ${OUT_DIR}`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Export failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
