// anonymous visitors are not allowed on the tweet pages
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.redirect('/?login=required');
}

// makes the logged in user and the one time message available in every view
function exposeUser(req, res, next) {
  res.locals.currentUser = (req.session && req.session.user) || null;
  res.locals.loginRequired = req.query.login === 'required';
  res.locals.registered = req.query.registered === '1';

  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  } else {
    res.locals.flash = null;
  }

  next();
}

module.exports = { isLoggedIn, exposeUser };
