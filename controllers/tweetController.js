/**
 * controllers/tweetController.js -- THE GRADED CRUD
 *
 * Every action here assumes middleware/auth.js isLoggedIn already ran.
 * Every write follows the same shape:
 *   validate -> if invalid: re-render the same form, status 400, input preserved
 *            -> if valid:   save and REDIRECT (never render straight after a POST)
 *
 * URLs match the wireframe exactly:
 *   GET  /tweet              list
 *   GET  /addTweet           form
 *   POST /addTweet           create
 *   GET  /tweet/:id          one tweet
 *   GET  /tweet/edit/:id     form
 *   POST /tweet/edit/:id     update
 *   POST /tweet/:id/delete   delete
 */
const Tweet = require('../models/TweetSchema');
const { validate, tweetRules } = require('../middleware/validate');
const { findTweetOr404 } = require('../middleware/auth');

// GET /tweet
exports.index = async (req, res) => {
  const tweets = await Tweet.find().sort({ createdAt: -1 });
  res.render('tweets/index', { title: 'Welcome to Tweeter', tweets });
};

// GET /addTweet
exports.addForm = (req, res) => {
  res.render('tweets/add', { title: 'Add Tweet', errors: [], values: {} });
};

// POST /addTweet
exports.create = async (req, res) => {
  const { values, errors } = validate(req.body, tweetRules);

  if (errors.length) {
    // 400 + the form again + what they typed. Nothing is saved.
    return res.status(400).render('tweets/add', { title: 'Add Tweet', errors, values });
  }

  await Tweet.create({
    title: values.title,
    tweet: values.tweet,
    author: req.session.userId,
  });

  req.session.flash = { type: 'success', message: 'Tweet added successfully.' };
  return res.redirect('/tweet');
};

// GET /tweet/:id
exports.show = async (req, res) => {
  const tweet = await findTweetOr404(Tweet, req.params.id, res);
  if (!tweet) return;

  res.render('tweets/show', { title: tweet.title, tweet });
};

// GET /tweet/edit/:id
exports.editForm = async (req, res) => {
  const tweet = await findTweetOr404(Tweet, req.params.id, res);
  if (!tweet) return;

  res.render('tweets/edit', {
    title: `Edit ${tweet.title}`,
    tweet,
    errors: [],
    values: { title: tweet.title, tweet: tweet.tweet },
  });
};

// POST /tweet/edit/:id
exports.update = async (req, res) => {
  const tweet = await findTweetOr404(Tweet, req.params.id, res);
  if (!tweet) return;

  const { values, errors } = validate(req.body, tweetRules);

  if (errors.length) {
    return res.status(400).render('tweets/edit', {
      title: `Edit ${tweet.title}`,
      tweet,
      errors,
      values,
    });
  }

  tweet.title = values.title;
  tweet.tweet = values.tweet;
  await tweet.save(); // runs the schema rules as well as the controller rules

  req.session.flash = { type: 'success', message: 'Tweet updated successfully.' };
  return res.redirect(`/tweet/${tweet._id}`);
};

// POST /tweet/:id/delete
exports.destroy = async (req, res) => {
  const tweet = await findTweetOr404(Tweet, req.params.id, res);
  if (!tweet) return;

  await tweet.deleteOne();

  req.session.flash = { type: 'success', message: 'Tweet deleted.' };
  return res.redirect('/tweet');
};
