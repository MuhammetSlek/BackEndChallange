const User = require('../models/User');
const { validate, registerRules, loginRules } = require('../middleware/validate');

// GET /
exports.showAuthPage = (req, res) => {
  // already logged in? go straight to the tweets
  if (req.session.userId) return res.redirect('/tweet');

  res.render('index', {
    title: 'Login and Registration',
    errors: [],
    form: null,
    values: {},
  });
};

// POST /register
exports.register = async (req, res) => {
  const result = validate(req.body, registerRules);
  const values = result.values;
  const errors = result.errors;

  if (!errors.length && values.password !== values.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!errors.length) {
    const exists = await User.findOne({ email: values.email });
    if (exists) errors.push('An account with that email address already exists');
  }

  if (errors.length) {
    return res.status(400).render('index', {
      title: 'Login and Registration',
      errors: errors,
      form: 'register',
      values: values,
    });
  }

  await User.create({
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    password: values.password,
  });

  res.redirect('/?registered=1');
};

// POST /login
exports.login = async (req, res) => {
  const result = validate(req.body, loginRules);
  const values = result.values;
  const errors = result.errors;

  let user = null;

  if (!errors.length) {
    user = await User.findOne({ email: values.email });
    const ok = user ? await user.checkPassword(values.password) : false;

    if (!ok) errors.push('Invalid email or password');
  }

  if (errors.length) {
    return res.status(400).render('index', {
      title: 'Login and Registration',
      errors: errors,
      form: 'login',
      values: { email: values.email },
    });
  }

  req.session.userId = user._id.toString();
  req.session.user = {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  res.redirect('/tweet');
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};
