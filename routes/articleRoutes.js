/**
 * routes/articleRoutes.js -- URL -> CONTROLLER MAP (listings)
 *
 *   GET  /articles              -> articleController.index
 *   GET  /articles/new          -> isLoggedIn, articleController.newForm
 *   POST /articles              -> isLoggedIn, articleController.create
 *   GET  /articles/:id          -> articleController.show
 *   GET  /articles/:id/edit     -> isLoggedIn, articleController.editForm
 *   POST /articles/:id/edit     -> isLoggedIn, articleController.update
 *   POST /articles/:id/delete   -> isLoggedIn, articleController.destroy
 *
 * Delete is a POST (never a GET) because a GET link can be triggered by a browser
 * prefetch or a crawler. The button in the view is styled to look like a link.
 */
