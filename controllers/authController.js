/**
 * controllers/authController.js -- THE "C" FOR AUTHENTICATION
 *
 * One exported async function per action. They only read the request,
 * call a model, then render a view or redirect -- no database code inside the views.
 *
 * Planned functions:
 *   showRegisterAndLogin -> GET  /          render the page with BOTH forms (wireframe Demo 2)
 *   register             -> POST /register  validate, hash password, create user, log them in
 *   login                -> POST /login     find user, compare password, save user in session
 *   showWelcome          -> GET  /welcome   protected page showing the logged-in user's info
 *   logout               -> POST /logout    destroy the session, back to /
 *
 * The wireframe puts Login and Register forms on the same URL ("/"), which is why
 * the two POST routes have different paths but the GET route does not.
 */
