/**
 * scripts/smoke-http.js -- END-TO-END TEST OVER REAL HTTP
 *
 * Run it with:  npm run test:http
 *
 * It starts the real app on a random port, keeps the session cookie between
 * requests, and walks the exact flow the brief describes:
 *
 *   anonymous blocked -> register -> login -> list -> add (invalid then valid)
 *   -> show -> edit (invalid then valid) -> delete -> 404s
 *
 * It creates its own test user and deletes it afterwards, so it can be run
 * repeatedly without polluting the database.
 */
require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const { app } = require('../app');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tweet = require('../models/TweetSchema');

let cookie = '';
let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

function same(name, actual, expected) {
  ok(name, actual === expected, `expected ${expected}, got ${actual}`);
}

async function request(method, path, form) {
  const headers = {};
  if (cookie) headers.cookie = cookie;

  let body;
  if (form) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(form).toString();
  }

  const res = await fetch(base + path, { method, headers, body, redirect: 'manual' });

  const setCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);

  for (const raw of setCookies) {
    const pair = raw.split(';')[0];
    if (!pair || pair.endsWith('=')) continue; // cookie being cleared
    cookie = pair;
  }

  return { status: res.status, location: res.headers.get('location'), text: await res.text() };
}

const repeat = (char, n) => char.repeat(n);

let base = '';
let server;
let testEmail = '';
let createdId = '';

(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  console.log(`Testing against ${base}\n`);

  testEmail = `smoke-${Date.now()}@example.com`;

  console.log('1. Anonymous visitors are blocked');
  let res = await request('GET', '/tweet');
  same('GET /tweet -> redirect', res.status, 302);
  ok('redirect points at the login page', (res.location || '').startsWith('/'));

  res = await request('GET', '/addTweet');
  same('GET /addTweet -> redirect', res.status, 302);

  res = await request('GET', '/');
  same('GET / shows the login/registration page', res.status, 200);
  ok('page contains a Login panel', res.text.includes('Login'));
  ok('page contains a Register panel', res.text.includes('Register'));

  console.log('\n2. Registration');
  res = await request('POST', '/register', {});
  same('empty register form -> 400', res.status, 400);
  ok('shows required errors', res.text.includes('is required'));

  res = await request('POST', '/register', {
    firstName: 'Smoke',
    lastName: 'Tester',
    email: 'not-an-email',
    password: 'secret123',
    confirmPassword: 'secret123',
  });
  same('invalid email -> 400', res.status, 400);
  ok('reports an invalid email', res.text.toLowerCase().includes('valid email'));

  res = await request('POST', '/register', {
    firstName: 'Smoke',
    lastName: 'Tester',
    email: testEmail,
    password: 'secret123',
    confirmPassword: 'different',
  });
  same('password mismatch -> 400', res.status, 400);
  ok('reports the mismatch', res.text.includes('Passwords do not match'));

  res = await request('POST', '/register', {
    firstName: 'Smoke',
    lastName: 'Tester',
    email: testEmail,
    password: 'secret123',
    confirmPassword: 'secret123',
  });
  same('valid registration -> redirect', res.status, 302);

  res = await request('POST', '/register', {
    firstName: 'Smoke',
    lastName: 'Tester',
    email: testEmail,
    password: 'secret123',
    confirmPassword: 'secret123',
  });
  same('duplicate email -> 400', res.status, 400);
  ok('reports the duplicate', res.text.includes('already exists'));

  const storedUser = await User.findOne({ email: testEmail });
  ok('user was saved', !!storedUser);
  ok('password is stored as a bcrypt hash', !!storedUser && storedUser.password.startsWith('$2'));

  console.log('\n3. Login');
  res = await request('POST', '/login', { email: testEmail, password: 'wrong-password' });
  same('wrong password -> 400', res.status, 400);
  ok('does not reveal which field was wrong', res.text.includes('Invalid email or password'));

  res = await request('POST', '/login', { email: testEmail, password: 'secret123' });
  same('correct login -> redirect to /tweet', res.status, 302);
  same('redirect target', res.location, '/tweet');
  ok('session cookie set', cookie.startsWith('connect.sid='));

  console.log('\n4. Tweet list');
  res = await request('GET', '/tweet');
  same('GET /tweet -> 200', res.status, 200);
  ok('shows the welcome heading', res.text.includes('Welcome to Tweeter'));
  ok('shows the tweet count', /There (is|are)/.test(res.text));
  ok('has an Add Tweet link', res.text.includes('/addTweet'));

  console.log('\n5. Create validation (Title > 20, Tweet <= 50)');
  res = await request('POST', '/addTweet', {});
  same('empty form -> 400', res.status, 400);
  ok('both fields reported', res.text.includes('Title is required') && res.text.includes('Tweet is required'));

  res = await request('POST', '/addTweet', { title: repeat('a', 20), tweet: 'short body' });
  same('title of 20 chars -> 400', res.status, 400);
  ok('reports "longer than 20"', res.text.includes('longer than 20'));
  ok('keeps what was typed', res.text.includes(repeat('a', 20)));

  res = await request('POST', '/addTweet', { title: repeat('a', 21), tweet: repeat('b', 51) });
  same('tweet of 51 chars -> 400', res.status, 400);
  ok('reports "no longer than 50"', res.text.includes('no longer than 50'));

  res = await request('POST', '/addTweet', { title: '   ', tweet: 'valid body here' });
  same('whitespace-only title -> 400', res.status, 400);
  ok('treated as empty', res.text.includes('Title is required'));

  const validTitle = 'Nodejs is a runtime for JavaScript';
  res = await request('POST', '/addTweet', { title: validTitle, tweet: repeat('b', 50) });
  same('title 21+ and tweet exactly 50 -> redirect', res.status, 302);
  same('redirect goes to the list', res.location, '/tweet');

  const created = await Tweet.findOne({ title: validTitle });
  ok('tweet saved in MongoDB', !!created);
  createdId = created ? created._id.toString() : '';

  console.log('\n6. List + detail');
  res = await request('GET', '/tweet');
  ok('new tweet appears in the list', res.text.includes(validTitle));
  ok('list shows a See More link', res.text.includes(`/tweet/${createdId}`));
  ok('list shows a date', /\d{1,2}\/\d{1,2}\/\d{4}/.test(res.text));

  res = await request('GET', `/tweet/${createdId}`);
  same('GET /tweet/:id -> 200', res.status, 200);
  ok('shows the title', res.text.includes(validTitle));
  ok('shows the body', res.text.includes(repeat('b', 50)));
  ok('has an Edit link', res.text.includes(`/tweet/edit/${createdId}`));
  ok('has a Delete control', res.text.includes(`/tweet/${createdId}/delete`));

  console.log('\n7. Bad ids');
  res = await request('GET', '/tweet/abc');
  same('non-ObjectId -> 404', res.status, 404);
  res = await request('GET', '/tweet/000000000000000000000000');
  same('unknown ObjectId -> 404', res.status, 404);
  res = await request('GET', '/nope');
  same('unknown route -> 404', res.status, 404);

  console.log('\n8. Update');
  res = await request('GET', `/tweet/edit/${createdId}`);
  same('edit form -> 200', res.status, 200);
  ok('form is pre-filled with the title', res.text.includes(validTitle));

  res = await request('POST', `/tweet/edit/${createdId}`, { title: repeat('c', 20), tweet: 'ok body' });
  same('invalid update -> 400', res.status, 400);
  ok('reports the title rule', res.text.includes('longer than 20'));

  const unchanged = await Tweet.findById(createdId);
  ok('database was NOT modified by the invalid update', unchanged.title === validTitle);

  const updatedTitle = 'React is a library for building interfaces';
  res = await request('POST', `/tweet/edit/${createdId}`, { title: updatedTitle, tweet: 'updated body text' });
  same('valid update -> redirect', res.status, 302);
  same('redirect goes to the tweet', res.location, `/tweet/${createdId}`);

  res = await request('GET', `/tweet/${createdId}`);
  ok('updated title is shown', res.text.includes(updatedTitle));
  ok('updated body is shown', res.text.includes('updated body text'));

  console.log('\n9. Delete');
  res = await request('GET', `/tweet/${createdId}/delete`);
  same('GET on the delete route is not a valid action', res.status, 404);

  res = await request('POST', `/tweet/${createdId}/delete`);
  same('POST delete -> redirect', res.status, 302);
  same('redirect goes to the list', res.location, '/tweet');
  ok('tweet removed from MongoDB', (await Tweet.findById(createdId)) === null);

  res = await request('GET', `/tweet/${createdId}`);
  same('deleted tweet now 404s', res.status, 404);

  console.log('\n10. Logout');
  cookie = '';
  res = await request('GET', '/logout');
  same('GET /logout -> redirect', res.status, 302);
  cookie = '';
  res = await request('GET', '/tweet');
  same('after logout the tweet page is blocked again', res.status, 302);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('\nSMOKE TEST CRASHED:', err);
  process.exitCode = 1;
})
  .finally(async () => {
    try {
      if (testEmail) await User.deleteOne({ email: testEmail });
      if (createdId) await Tweet.findByIdAndDelete(createdId).catch(() => {});
      if (server) server.close();
      await mongoose.disconnect();
    } catch {
      /* ignore cleanup problems */
    }
    // The session store keeps its own MongoDB client open; end the process.
    setTimeout(() => process.exit(failed === 0 ? 0 : 1), 100);
  });
