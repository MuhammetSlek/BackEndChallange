const mongoose = require('mongoose');

// Schema is called Tweet as the brief asks, model file is TweetSchema.js
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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tweet', tweetSchema);
