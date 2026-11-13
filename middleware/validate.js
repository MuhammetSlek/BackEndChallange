/**
 * middleware/validate.js -- ONE VALIDATOR, MANY FORMS
 *
 * The real reason this file exists: the demos validate in opposite directions.
 *   Demo 1 (articles):  title MIN 26, body MIN 101   -> "longer than"
 *   Demo 2 (users):     firstName MAX 10, lastName MAX 15 -> "not longer than"
 * Hardcoding either one means rewriting it for the official challenge.
 *
 * So the plan is a small RULES object per form:
 *
 *   const registerRules = {
 *     firstName: { label: 'First Name', required: true, max: 10 },
 *     lastName:  { label: 'Last Name',  required: true, max: 15 },
 *     email:     { label: 'Email Address', required: true, type: 'email' },
 *     password:  { label: 'Password', required: true, min: 6 },
 *   };
 *   const articleRules = {
 *     title: { label: 'Title',   required: true, min: 26 },
 *     body:  { label: 'Article', required: true, min: 101 },
 *   };
 *
 * A function like validate(req.body, rules) returns { values, errors }:
 *   - values = the trimmed input (so the form can be re-filled after an error)
 *   - errors = an array of readable messages to print in the form
 *
 * Validating in code as well as in the Mongoose schema is deliberate:
 * the schema stops bad data, this stops a bad page.
 */
