/**
 * scripts/seed.js -- DEMO DATA
 *
 * Run it with:  npm run seed
 *
 * Creates one demo account and four tweets, so the site is not empty when you
 * record the video or take Compass screenshots. Safe to run more than once:
 * it skips anything that already exists.
 *
 *   demo account: demo@tweeter.com / password123
 *
 * Every tweet respects the brief's rules (title > 20, tweet <= 50), and the
 * dates are set by hand so the list demonstrates newest-first ordering.
 */
require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tweet = require('../models/TweetSchema');

const DEMO = {
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@tweeter.com',
  password: 'password123',
};

const TWEETS = [
  {
    title: 'JavaScript is the language of the web',
    tweet: 'A flexible language that runs in every browser.',
    createdAt: new Date('2020-08-13T10:00:00Z'),
  },
  {
    title: 'Nodejs lets you run JavaScript on servers',
    tweet: 'Same language, different runtime, real servers.',
    createdAt: new Date('2020-08-14T09:30:00Z'),
  },
  {
    title: 'React is a library for building interfaces',
    tweet: 'Components, state and props in one place.',
    createdAt: new Date('2020-08-14T16:15:00Z'),
  },
  {
    title: 'MongoDB stores documents as BSON',
    tweet: 'Schema-less and fast for read-heavy apps.',
    createdAt: new Date('2020-08-15T11:45:00Z'),
  },
];

(async () => {
  await connectDB();

  let user = await User.findOne({ email: DEMO.email });
  if (user) {
    console.log(`Demo user already exists: ${DEMO.email}`);
  } else {
    user = await User.create(DEMO);
    console.log(`Demo user created: ${DEMO.email} / ${DEMO.password}`);
  }

  for (const data of TWEETS) {
    const exists = await Tweet.findOne({ title: data.title });
    if (exists) {
      console.log(`  skip (exists): ${data.title}`);
      continue;
    }

    const doc = await Tweet.create({
      title: data.title,
      tweet: data.tweet,
      author: user._id,
    });

    // timestamps: false so the hand-picked date survives
    await Tweet.updateOne(
      { _id: doc._id },
      { $set: { createdAt: data.createdAt, updatedAt: data.createdAt } },
      { timestamps: false }
    );

    console.log(`  created: ${data.title}`);
  }

  const total = await Tweet.countDocuments();
  console.log(`\nDone. ${total} tweet(s) in the database.`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
