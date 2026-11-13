/**
 * app.js -- THE ENTRY POINT
 *
 * Order matters:
 *   1. .env                 so process.env has everything below
 *   2. express() + views    EJS, the views folder
 *   3. body parsing         form data -> req.body
 *   4. static files         public/css, public/images
 *   5. sessions             stored in MongoDB via connect-mongo
 *   6. exposeUser           currentUser / flash available to every view
 *   7. routes               auth first, then tweets
 *   8. 404 + error handler  last, always
 *   9. connectDB + listen
 *
 * The app is exported so scripts/smoke-http.js can test it without spawning a
 * second process. `require.main === module` means "start only when run directly".
 */
require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const session = require('express-session');
// connect-mongo v6 exports named symbols, not the class itself.
const { MongoStore } = require('connect-mongo');

const connectDB = require('./config/db');
const { exposeUser } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const tweetRoutes = require('./routes/tweetRoutes');

const app = express();

// ---- view engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- body parsing + static files ----
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- sessions (stored in MongoDB, so a restart does not log everyone out) ----
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24, // one day
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(exposeUser);

// ---- view helpers (the wireframe prints dates like 14/8/2020) ----
app.locals.formatDate = (value) => {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// ---- routes ----
app.use('/', authRoutes);
app.use('/', tweetRoutes);

// ---- 404: Express 5 removed app.get('*'), so use a bare app.use ----
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

// ---- error handler: 4 arguments, always last ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('error', {
    title: 'Something went wrong',
    message: err.message,
  });
});

async function start() {
  await connectDB();
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('  /            login + registration');
    console.log('  /tweet       tweet list (login required)');
    console.log('  /addTweet    add a tweet (login required)');
  });
  return server;
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
}

module.exports = { app, start };
