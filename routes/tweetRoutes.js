const express = require('express');
const tweetController = require('../controllers/tweetController');
const { isLoggedIn } = require('../middleware/auth');

const router = express.Router();

router.get('/tweet', isLoggedIn, tweetController.index);

router.get('/addTweet', isLoggedIn, tweetController.addForm);
router.post('/addTweet', isLoggedIn, tweetController.create);

// keep the edit routes before /tweet/:id
router.get('/tweet/edit/:id', isLoggedIn, tweetController.editForm);
router.post('/tweet/edit/:id', isLoggedIn, tweetController.update);

router.get('/tweet/:id', isLoggedIn, tweetController.show);

router.post('/tweet/:id/delete', isLoggedIn, tweetController.destroy);

module.exports = router;
