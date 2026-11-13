/**
 * middleware/auth.js -- THE BOUNCER
 *
 * isLoggedIn  : blocks every tweet route for anonymous visitors, exactly as the
 *               brief requires ("Anonymous users can't go to the Tweet page,
 *               add, edit, or delete tweets").
 * exposeUser  : makes the logged-in user and any one-shot flash message available
 *               to every EJS template without every controller passing them in.
 */

function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) return next();

  // Tell the login page why we bounced them, then send them home.
  return res.redirect('/?login=required');
}

function exposeUser(req, res, next) {
  const user = req.session ? req.session.user : null;

  res.locals.currentUser = user || null;
  res.locals.loginRequired = req.query.login === 'required';
  res.locals.registered = req.query.registered === '1';

  // Flash messages are read once and then removed, so a refresh does not repeat them.
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  } else {
    res.locals.flash = null;
  }

  next();
}

/**
 * Small helpers so controllers never repeat this logic.
 * Returns the tweet, or sends the 404 page and returns null.
 */
async function findTweetOr404(Tweet, id, res) {
  const mongoose = require('mongoose');

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

module.exports = { isLoggedIn, exposeUser, findTweetOr404 };
