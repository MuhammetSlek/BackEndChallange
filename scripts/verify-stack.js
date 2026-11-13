/**
 * scripts/verify-stack.js -- PROVE THE RUNTIME STACK WORKS
 *
 * Run it with:  npm run stack:test
 *
 * These versions are new (Express 5, EJS 7, Mongoose 9, connect-mongo 6), and most
 * tutorials online use the older ones. This script checks the exact behaviour the
 * project will rely on, so a version surprise shows up now and not at the deadline:
 *
 *   1. EJS renders a template from a views folder
 *   2. Express 5 serves it on a real port and parses a form POST body
 *   3. Express 5 handles a catch-all 404 without crashing
 *   4. bcryptjs hashes and compares a password
 *   5. Mongoose 9 enforces min/max length boundaries exactly as the brief demands
 *   6. express-session + connect-mongo stores a session in MongoDB and reads it back
 *
 * Everything is created in a temp folder / temp collection and removed afterwards.
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const session = require('express-session');
// connect-mongo v6 exports named symbols, NOT the class itself:
//   require('connect-mongo').MongoStore.create({...})
// Writing `const MongoStore = require('connect-mongo')` silently gives an object
// and fails later with "MongoStore.create is not a function".
const { MongoStore } = require('connect-mongo');
const connectDB = require('../config/db');

let failures = 0;
const pass = (m) => console.log(`  PASS  ${m}`);
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  failures++;
};
const info = (m) => console.log(`  INFO  ${m}`);

function check(condition, okMsg, badMsg) {
  condition ? pass(okMsg) : fail(badMsg);
}

(async () => {
  console.log('\n1. EJS');
  const html = ejs.render('<h1><%= name %></h1>', { name: 'Hello' });
  check(html === '<h1>Hello</h1>', 'ejs.render works', `unexpected output: ${html}`);
  const escaped = ejs.render('<%= v %>', { v: '<script>x</script>' });
  check(escaped.includes('&lt;script&gt;'), '<%= %> escapes HTML (XSS-safe)', 'escaping is NOT working');

  console.log('\n2. Express 5 + form body + 404');
  const viewsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'views-'));
  fs.writeFileSync(path.join(viewsDir, 'probe.ejs'), '<h1><%= who %></h1>');

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', viewsDir);
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (req, res) => res.render('probe', { who: 'world' }));
  app.post('/echo', (req, res) => res.json({ body: req.body }));
  app.use((req, res) => res.status(404).send('not found'));

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const res = await fetch(base + '/');
    const text = await res.text();
    check(res.status === 200 && text === '<h1>world</h1>', 'res.render serves an EJS view', `got ${res.status}: ${text}`);

    const post = await fetch(base + '/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: 'from form' }),
    });
    const json = await post.json();
    check(json.body && json.body.title === 'from form', 'form data arrives in req.body', `got ${JSON.stringify(json)}`);

    const missing = await fetch(base + '/does-not-exist');
    check(missing.status === 404, 'catch-all 404 works and does not crash', `got ${missing.status}`);
  } finally {
    server.close();
    fs.rmSync(viewsDir, { recursive: true, force: true });
  }

  console.log('\n3. bcryptjs');
  const hash = await bcrypt.hash('secret123', 10);
  check(hash !== 'secret123' && hash.startsWith('$2'), 'password is hashed, not stored as-is', `unexpected hash: ${hash}`);
  check(await bcrypt.compare('secret123', hash), 'correct password matches', 'correct password did NOT match');
  check(!(await bcrypt.compare('wrong', hash)), 'wrong password is rejected', 'wrong password was accepted');

  console.log('\n4. Mongoose 9 validation boundaries');
  await connectDB();

  const probeSchema = new mongoose.Schema({
    title: { type: String, required: true, minlength: 26, trim: true },
    firstName: { type: String, required: true, maxlength: 10, trim: true },
  });
  const Probe = mongoose.model('__BoundaryProbe', probeSchema);

  async function valid(overrides) {
    try {
      await new Probe({ title: 'a'.repeat(26), firstName: 'a'.repeat(10), ...overrides }).validate();
      return true;
    } catch {
      return false;
    }
  }

  check(await valid({ title: 'a'.repeat(25) }) === false, 'title of 25 chars is rejected', 'title 25 chars was ACCEPTED');
  check(await valid({ title: 'a'.repeat(26) }) === true, 'title of 26 chars is accepted', 'title 26 chars was rejected');
  check(await valid({ title: 'a'.repeat(101) }) === true, 'body length 101 passes the min rule', 'min rule blocked 101');
  check(await valid({ firstName: 'a'.repeat(11) }) === false, 'firstName of 11 chars is rejected', 'firstName 11 chars was ACCEPTED');
  check(await valid({ firstName: 'a'.repeat(10) }) === true, 'firstName of 10 chars is accepted', 'firstName 10 chars was rejected');
  check(await valid({ title: '   ' }) === false, 'whitespace-only input is rejected (trim runs first)', 'whitespace-only input was ACCEPTED');
  check(await valid({ title: undefined }) === false, 'missing required field is rejected', 'missing required field was ACCEPTED');

  console.log('\n5. express-session + connect-mongo');
  const sessionCollection = '__session_probe__';
  const store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: sessionCollection,
    ttl: 60,
  });

  const sid = 'probe-' + Date.now();
  await new Promise((resolve, reject) =>
    store.set(sid, { cookie: { maxAge: 60000 }, userId: 'abc123' }, (err) => (err ? reject(err) : resolve()))
  );
  const loaded = await new Promise((resolve, reject) =>
    store.get(sid, (err, sess) => (err ? reject(err) : resolve(sess)))
  );
  check(loaded && loaded.userId === 'abc123', 'session is written to MongoDB and read back', 'session round-trip failed');

  // connect-mongo v6 names this method destroy(), not delete()
  await store.destroy(sid);
  const gone = await new Promise((resolve, reject) =>
    store.get(sid, (err, sess) => (err ? reject(err) : resolve(sess)))
  );
  check(!gone, 'session delete works (logout path)', 'session was not deleted');

  store.close();
  await mongoose.connection.db.collection(sessionCollection).drop().catch(() => info('session probe collection already gone'));
  pass('probe collection removed');

  await mongoose.disconnect();

  console.log(
    failures === 0
      ? '\nAll checks passed. The stack behaves as the plan expects.'
      : `\n${failures} check(s) FAILED - tell me the output before writing code.`
  );
  process.exit(failures === 0 ? 0 : 1);
})().catch(async (err) => {
  console.error('\nVerification CRASHED:', err.message);
  console.error(err.stack.split('\n').slice(0, 4).join('\n'));
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
