const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Route: /api/feedback
router.post('/', feedbackController.saveFeedback);

module.exports = router;
