require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const connectDB = require('./config/db');
const { exposeUser } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const tweetRoutes = require('./routes/tweetRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// sessions are kept in mongo so a restart does not log everyone out
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24,
    }),
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(exposeUser);

app.use('/', authRoutes);
app.use('/', tweetRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

// errors
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).render('error', { title: 'Error', message: err.message });
});

async function start() {
  await connectDB();
  const port = process.env.PORT || 3000;
  return app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((err) => {
    console.log('Could not start:', err.message);
    process.exit(1);
  });
}

module.exports = { app, start };
