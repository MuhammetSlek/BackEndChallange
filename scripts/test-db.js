/**
 * scripts/test-db.js -- PROVE THE DATABASE WORKS
 *
 * Run it with:  npm run db:test
 *
 * Checks, in order:
 *   1. .env loads and the URI is not the placeholder
 *   2. the connection succeeds (auth + IP allow-list + TLS)
 *   3. it landed on the expected database name
 *   4. read: the collections are listed with document counts
 *   5. write: a temporary document can be inserted, read back and deleted
 *   6. the expected collections from the schema plan exist
 *
 * It cleans up after itself: the probe collection is dropped, so it is safe to run
 * as many times as you like. The password is always masked in the output.
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const EXPECTED_DB = 'backend_challenge';
const EXPECTED_COLLECTIONS = ['users', 'articles'];
const PROBE = '__connection_probe__';

function maskUri(uri = '') {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

function pass(msg) {
  console.log(`  PASS  ${msg}`);
}
function fail(msg) {
  console.log(`  FAIL  ${msg}`);
  process.exitCode = 1;
}

(async () => {
  console.log(`URI     : ${maskUri(process.env.MONGODB_URI)}\n`);

  // 1. connect
  await connectDB();
  pass('connection established (auth, IP allow-list, TLS)');

  const db = mongoose.connection.db;

  // 2. expected database
  if (mongoose.connection.name === EXPECTED_DB) {
    pass(`database name is "${EXPECTED_DB}"`);
  } else {
    fail(`database is "${mongoose.connection.name}", expected "${EXPECTED_DB}"`);
  }

  // 3. collections + counts
  const collections = (await db.listCollections().toArray()).map((c) => c.name);
  if (collections.length === 0) {
    console.log('  INFO  no collections yet (empty database)');
  } else {
    for (const name of collections) {
      const count = await db.collection(name).countDocuments();
      pass(`collection "${name}" readable (${count} document${count === 1 ? '' : 's'})`);
    }
  }

  // 4. write permission, then clean up
  try {
    const probe = db.collection(PROBE);
    await probe.insertOne({ ok: true, at: new Date() });
    const found = await probe.findOne({ ok: true });
    if (found && found.ok === true) pass('write permission (insert + read back)');
    else fail('wrote a document but could not read it back');
    await probe.drop();
    pass('probe collection removed');
  } catch (err) {
    fail(`write permission: ${err.message}`);
    await db.collection(PROBE).drop().catch(() => {});
  }

  // 5. schema plan
  const missing = EXPECTED_COLLECTIONS.filter((c) => !collections.includes(c));
  if (missing.length === 0) {
    pass(`planned collections exist: ${EXPECTED_COLLECTIONS.join(', ')}`);
  } else {
    fail(`missing planned collection(s): ${missing.join(', ')} (create them in Compass)`);
  }

  console.log(
    process.exitCode ? '\nSome checks FAILED (see above).' : '\nAll checks passed. Database is ready.'
  );

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('\nConnection FAILED:', err.message);

  const m = err.message;
  if (m.includes('Invalid database name')) {
    console.error('-> The database name in the URI is malformed. Check for a double slash');
    console.error('   (mongodb.net//dbname) or a stray space. Expected: mongodb.net/backend_challenge');
  } else if (m.toLowerCase().includes('bad auth') || m.includes('Authentication failed')) {
    console.error('-> Wrong username or password, or special characters are not URL-encoded.');
  } else if (m.includes('timed out') || m.includes('ENOTFOUND') || m.includes('ETIMEDOUT')) {
    console.error('-> Cluster is paused, your IP is not allow-listed, or there is no internet.');
  } else if (m.includes('placeholder')) {
    console.error('-> Edit .env and put your real mongodb+srv:// URI in MONGODB_URI.');
  }

  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
