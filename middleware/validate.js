/**
 * middleware/validate.js -- ONE VALIDATOR FOR EVERY FORM
 *
 * The brief validates in two opposite directions at once:
 *   Title: longer than 20 characters   -> min
 *   Tweet: no longer than 50 characters -> max
 * so the limits must be data, not hardcoded if-statements.
 *
 * Rules are described per field, and validate() returns:
 *   values -> trimmed input, so a failed form can be re-filled with what was typed
 *   errors -> human readable messages, rendered by views/partials/errors.ejs
 *
 * Every field is required (brief: "No fields can be empty"). Whitespace-only
 * input counts as empty because the value is trimmed before it is checked.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input, rules) {
  const values = {};
  const errors = [];
  const body = input || {};

  for (const [field, rule] of Object.entries(rules)) {
    const raw = body[field];
    let value = typeof raw === 'string' ? raw.trim() : '';

    if (rule.type === 'email') value = value.toLowerCase();
    values[field] = value;

    if (rule.required && value === '') {
      errors.push(`${rule.label} is required`);
      continue;
    }

    // An optional field that was left empty has nothing to check.
    if (value === '') continue;

    // "longer than 20" is stored as min: 21, so the message is derived back.
    if (rule.min && value.length < rule.min) {
      errors.push(`${rule.label} must be longer than ${rule.min - 1} characters`);
    }

    if (rule.max && value.length > rule.max) {
      errors.push(`${rule.label} must be no longer than ${rule.max} characters`);
    }

    if (rule.type === 'email' && !EMAIL_PATTERN.test(value)) {
      errors.push(`${rule.label} must be a valid email address`);
    }
  }

  return { values, errors };
}

/* ---- Rule sets: the only place the brief's numbers appear ---- */

const tweetRules = {
  title: { label: 'Title', required: true, min: 21 },  // longer than 20
  tweet: { label: 'Tweet', required: true, max: 50 },  // no longer than 50
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
