const mongoose = require('mongoose');
const Tweet = require('../models/TweetSchema');
const { validate, tweetRules } = require('../middleware/validate');

// find a tweet or show the 404 page
async function findTweet(id, res) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).render('404', { title: 'Tweet not found' });
    return null;
  }

  const tweet = await Tweet.findById(id);

  if (!tweet) {
    res.status(404).render('404', { title: 'Tweet not found' });
    return null;
  }

  return tweet;
}

// GET /tweet
exports.index = async (req, res) => {
  const tweets = await Tweet.find().sort({ createdAt: -1 });
  res.render('tweets/index', { title: 'Welcome to Tweeter', tweets: tweets });
};

// GET /addTweet
exports.addForm = (req, res) => {
  res.render('tweets/add', { title: 'Add Tweet', errors: [], values: {} });
};

// POST /addTweet
exports.create = async (req, res) => {
  const result = validate(req.body, tweetRules);

  if (result.errors.length) {
    return res.status(400).render('tweets/add', {
      title: 'Add Tweet',
      errors: result.errors,
      values: result.values,
    });
  }

  await Tweet.create({
    title: result.values.title,
    tweet: result.values.tweet,
    author: req.session.userId,
  });

  req.session.flash = { type: 'ok', message: 'Tweet added.' };
  res.redirect('/tweet');
};

// GET /tweet/:id
exports.show = async (req, res) => {
  const tweet = await findTweet(req.params.id, res);
  if (!tweet) return;

  res.render('tweets/show', { title: tweet.title, tweet: tweet });
};

// GET /tweet/edit/:id
exports.editForm = async (req, res) => {
  const tweet = await findTweet(req.params.id, res);
  if (!tweet) return;

  res.render('tweets/edit', {
    title: 'Edit Tweet',
    tweet: tweet,
    errors: [],
    values: { title: tweet.title, tweet: tweet.tweet },
  });
};

// POST /tweet/edit/:id
exports.update = async (req, res) => {
  const tweet = await findTweet(req.params.id, res);
  if (!tweet) return;

  const result = validate(req.body, tweetRules);

  if (result.errors.length) {
    return res.status(400).render('tweets/edit', {
      title: 'Edit Tweet',
      tweet: tweet,
      errors: result.errors,
      values: result.values,
    });
  }

  tweet.title = result.values.title;
  tweet.tweet = result.values.tweet;
  await tweet.save();

  req.session.flash = { type: 'ok', message: 'Tweet updated.' };
  res.redirect('/tweet/' + tweet._id);
};

// POST /tweet/:id/delete
exports.destroy = async (req, res) => {
  const tweet = await findTweet(req.params.id, res);
  if (!tweet) return;

  await tweet.deleteOne();

  req.session.flash = { type: 'ok', message: 'Tweet deleted.' };
  res.redirect('/tweet');
};
