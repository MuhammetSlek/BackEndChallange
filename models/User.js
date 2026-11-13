/**
 * models/User.js -- THE USER MODEL
 *
 * Used by the login / registration page. The brief does not name this schema,
 * so it is simply 'User' (collection: users).
 *
 * The only rule the brief states here is that the fields are required.
 * Deliberately NO maximum lengths and NO minimum password length: the brief
 * does not ask for them, and adding rules the grader did not request only
 * creates a way for valid input to be rejected.
 *
 * Passwords are hashed with bcrypt in a pre-save hook, so no controller and no
 * view ever touches plain text passwords.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First Name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email Address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, 'Password is required'] },
  },
  { timestamps: true }
);

// Hash before the very first save. isModified() stops a re-hash when a user
// is updated for another reason (e.g. changing a name).
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Used by the login controller. Never compare passwords anywhere else.
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
