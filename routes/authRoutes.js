/**
 * routes/authRoutes.js -- URL -> CONTROLLER MAP (authentication)
 *
 *   GET  /          login + registration page (the two forms from the wireframe)
 *   POST /register  create account
 *   POST /login     start session -> redirect to /tweet
 *   GET  /logout    destroy session -> redirect to /
 *
 * No guards here: anonymous visitors are supposed to reach these.
 */
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.showAuthPage);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;
