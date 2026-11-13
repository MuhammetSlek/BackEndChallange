/**
 * routes/authRoutes.js -- URL -> CONTROLLER MAP (authentication)
 *
 *   GET  /          -> authController.showRegisterAndLogin
 *   POST /register  -> authController.register
 *   POST /login     -> authController.login
 *   GET  /welcome   -> isLoggedIn, authController.showWelcome
 *   POST /logout    -> authController.logout
 *
 * Routes stay "dumb": they contain no logic, only the mapping. That is what makes
 * it an MVC app and what makes the URL bar match the wireframe.
 */
