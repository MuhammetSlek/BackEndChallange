// checks a form body against a set of rules and returns the cleaned values
// plus the error messages, so the form can be filled in again after a mistake

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input, rules) {
  const values = {};
  const errors = [];
  const body = input || {};

  for (const field in rules) {
    const rule = rules[field];
    const raw = body[field];
    let value = typeof raw === 'string' ? raw.trim() : '';

    if (rule.type === 'email') value = value.toLowerCase();
    values[field] = value;

    if (rule.required && value === '') {
      errors.push(rule.label + ' is required');
      continue;
    }

    if (value === '') continue;

    if (rule.min && value.length < rule.min) {
      errors.push(rule.label + ' must be longer than ' + (rule.min - 1) + ' characters');
    }

    if (rule.max && value.length > rule.max) {
      errors.push(rule.label + ' must be no longer than ' + rule.max + ' characters');
    }

    if (rule.type === 'email' && !EMAIL.test(value)) {
      errors.push(rule.label + ' must be a valid email address');
    }
  }

  return { values: values, errors: errors };
}

const tweetRules = {
  title: { label: 'Title', required: true, min: 21 },
  tweet: { label: 'Tweet', required: true, max: 50 },
};

const registerRules = {
  firstName: { label: 'First Name', required: true },
  lastName: { label: 'Last Name', required: true },
  email: { label: 'Email Address', required: true, type: 'email' },
  password: { label: 'Password', required: true },
  confirmPassword: { label: 'Confirm Password', required: true },
};

const loginRules = {
  email: { label: 'Email Address', required: true, type: 'email' },
  password: { label: 'Password', required: true },
};

module.exports = { validate, tweetRules, registerRules, loginRules };
