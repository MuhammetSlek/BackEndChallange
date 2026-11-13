/**
 * controllers/authController.js -- REGISTER / LOGIN / LOGOUT
 *
 * The landing page at "/" holds both forms, exactly like the wireframe, so the
 * two POST routes are different (/register and /login) while the GET is shared.
 */
const User = require('../models/User');
const { validate, registerRules, loginRules } = require('../middleware/validate');

// GET /
exports.showAuthPage = (req, res) => {
  res.render('index', {
    title: 'Login and Registration',
    errors: [],
    form: null,
    values: {},
  });
};

// POST /register
exports.register = async (req, res) => {
  const { values, errors } = validate(req.body, registerRules);

  // Cross-field rule: the two passwords must match.
  if (!errors.length && values.password !== values.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!errors.length) {
    const existing = await User.findOne({ email: values.email });
    if (existing) errors.push('An account with that email address already exists');
  }

  if (errors.length) {
    return res.status(400).render('index', {
      title: 'Login and Registration',
      errors,
      form: 'register',
      values,
    });
  }

  try {
    await User.create({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password, // hashed by the model's pre-save hook
    });
  } catch (err) {
    // Unique index race, or any other validation problem the model catches
    if (err.code === 11000) {
      return res.status(400).render('index', {
        title: 'Login and Registration',
        errors: ['An account with that email address already exists'],
        form: 'register',
        values,
      });
    }
    throw err;
  }

  return res.redirect('/?registered=1');
};

// POST /login
exports.login = async (req, res) => {
  const { values, errors } = validate(req.body, loginRules);
  let user = null;

  if (!errors.length) {
    user = await User.findOne({ email: values.email });
    const passwordOk = user ? await user.comparePassword(values.password) : false;

    // One message for both cases: never reveal which half was wrong.
    if (!passwordOk) errors.push('Invalid email or password');
  }

  if (errors.length) {
    return res.status(400).render('index', {
      title: 'Login and Registration',
      errors,
      form: 'login',
      values: { ...values, password: '' },
    });
  }

  // Minimal session payload: no password, ever.
  req.session.userId = user._id.toString();
  req.session.user = {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  return res.redirect('/tweet');
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};
