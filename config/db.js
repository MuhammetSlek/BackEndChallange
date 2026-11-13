/**
 * config/db.js -- DATABASE CONNECTION
 *
 * Its only job: connect Mongoose to your MongoDB database using process.env.MONGODB_URI.
 * Keeping it in its own file means app.js stays readable and you can reuse the
 * connection anywhere. It will export a function like connectDB() that app.js calls once.
 *
 * The URI is kept in .env (never committed) so the same code works
 * against a local MongoDB or a MongoDB Atlas cluster.
 */
