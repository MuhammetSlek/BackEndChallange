/**
 * controllers/articleController.js -- THE "C" FOR LISTINGS (the graded CRUD)
 *
 * Planned functions:
 *   index      -> GET  /articles             list every article, newest first
 *   newForm    -> GET  /articles/new         empty form
 *   create     -> POST /articles             validate, save, redirect to the list
 *   show       -> GET  /articles/:id         one article  (+ 404 if the id is bad or missing)
 *   editForm   -> GET  /articles/:id/edit    form pre-filled with the article
 *   update     -> POST /articles/:id/edit    validate, update, redirect to the article
 *   destroy    -> POST /articles/:id/delete  delete, redirect to the list
 *
 * Rule for every write action: ALWAYS validate first, ALWAYS redirect after a
 * successful save (never render directly after a POST).
 */
