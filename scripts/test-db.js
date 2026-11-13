/**
 * scripts/test-db.js -- PROVE THE DATABASE CONNECTION WORKS
 *
 * Run it with:  npm run db:test
 *
 * It connects with the URI from .env, prints which database it landed on,
 * lists the collections and counts the documents in each one, then exits.
 * If something is wrong you get a readable error instead of a hung terminal.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Never print the password, even on error
function maskUri(uri = '') {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

(async () => {
  console.log('URI in use:', maskUri(process.env.MONGODB_URI));

  await connectDB();

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log('No collections yet (empty database).');
  } else {
    console.log('Collections:');
    for (const { name } of collections) {
      const count = await db.collection(name).countDocuments();
      console.log(`  - ${name} (${count} document${count === 1 ? '' : 's'})`);
    }
  }

  console.log('\nConnection test passed.');
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error('\nConnection test FAILED:', err.message);

  if (err.message.includes('bad auth') || err.name === 'MongoServerError') {
    console.error('-> Wrong username/password, or the password is not URL-encoded.');
  } else if (err.message.includes('timed out') || err.message.includes('ENOTFOUND')) {
    console.error('-> Cluster paused, IP not allow-listed, or no internet.');
  } else if (err.message.includes('placeholder')) {
    console.error('-> Edit .env and put your real mongodb+srv:// URI in MONGODB_URI.');
  }

  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
