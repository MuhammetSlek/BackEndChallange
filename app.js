/**
 * app.js -- THE ENTRY POINT (the "glue" of the whole app)
 *
 * This file will do 6 things, in this order:
 *   1. Load the .env file (dotenv) so process.env has MONGODB_URI, PORT, SESSION_SECRET.
 *   2. Connect to MongoDB (see config/db.js).
 *   3. Configure Express: EJS as the view engine, the public/ folder for CSS/images,
 *      and express.urlencoded() so form data arrives in req.body.
 *   4. Turn on sessions (express-session + connect-mongo) so a logged-in user is remembered.
 *   5. Plug in the routers from routes/ (one for auth, one for articles) and a 404 handler.
 *   6. app.listen(PORT).
 *
 * Nothing is implemented yet -- this file is intentionally empty.
 *
 * EXPRESS 5 NOTE (this project uses Express 5, not 4):
 *   - Do NOT write app.get('*', ...) -- that crashes in Express 5.
 *     Use app.use(...) with no path for the 404 catch-all.
 *   - Async errors in controllers are forwarded to the error handler automatically.
 */
