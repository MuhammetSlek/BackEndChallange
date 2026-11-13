/**
 * routes/tweetRoutes.js -- URL -> CONTROLLER MAP (tweets)
 *
 * The brief: "Anonymous users (not logged-in users) can't go to the Tweet page,
 * add, edit, or delete tweets." So isLoggedIn guards EVERY route below,
 * including the list at /tweet.
 *
 * URLs are copied from the wireframe's address bar:
 *   /tweet        /addTweet        /tweet/1        /tweet/edit/1
 */
const express = require('express');
const tweetController = require('../controllers/tweetController');
const { isLoggedIn } = require('../middleware/auth');

const router = express.Router();

router.get('/tweet', isLoggedIn, tweetController.index);

router.get('/addTweet', isLoggedIn, tweetController.addForm);
router.post('/addTweet', isLoggedIn, tweetController.create);

// /tweet/edit/:id must be declared before /tweet/:id so "edit" is not eaten
// as an id. (Express matches in order, but keeping it explicit avoids surprises.)
router.get('/tweet/edit/:id', isLoggedIn, tweetController.editForm);
router.post('/tweet/edit/:id', isLoggedIn, tweetController.update);

router.get('/tweet/:id', isLoggedIn, tweetController.show);

router.post('/tweet/:id/delete', isLoggedIn, tweetController.destroy);

module.exports = router;
