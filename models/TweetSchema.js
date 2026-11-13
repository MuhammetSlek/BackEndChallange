/**
 * models/TweetSchema.js -- THE TWEET MODEL
 *
 * The brief names this one explicitly:
 *   "The name of the schema must be Tweet"
 *   "The Schema should be named Tweet and the model file name is TweetSchema"
 * so: file = TweetSchema.js, model name = 'Tweet' (collection: tweets).
 *
 * Rules, straight from the brief:
 *   Title  -> required, longer than 20 characters  => minlength 21
 *   Tweet  -> required, no longer than 50 characters => maxlength 50
 *   date   -> handled by timestamps (createdAt / updatedAt)
 */
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      minlength: [21, 'Title must be longer than 20 characters'],
      trim: true,
    },
    tweet: {
      type: String,
      required: [true, 'Tweet is required'],
      maxlength: [50, 'Tweet must be no longer than 50 characters'],
      trim: true,
    },
    // Who wrote it. Not required by the brief, but it is free to record and
    // it means the data is not anonymous even if the UI never shows it.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tweet', tweetSchema);
