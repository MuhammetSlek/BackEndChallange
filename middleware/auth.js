/**
 * middleware/auth.js -- THE BOUNCER
 *
 * Exports:
 *   isLoggedIn   -> runs before protected routes. If req.session.user exists, continue;
 *                   otherwise redirect to / so strangers cannot open /welcome or create/edit.
 *   exposeUser   -> copies the session user into res.locals so every EJS view can use
 *                   "user" without every controller passing it in.
 *
 * Middleware = a small function that runs between the request and the controller.
 */
