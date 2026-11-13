/**
 * config/db.js -- DATABASE CONNECTION
 *
 * One job: connect Mongoose to MongoDB using MONGODB_URI from .env.
 * app.js calls connectDB() once, before it starts listening.
 */
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('USER:PASSWORD')) {
    throw new Error(
      'MONGODB_URI is missing or still the placeholder. Put your real Atlas URI in .env'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    // Fail fast instead of hanging forever when the cluster is paused or IP-blocked
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  console.log(`Database: ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
  });

  return mongoose.connection;
}

module.exports = connectDB;
