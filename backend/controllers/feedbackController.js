const db = require('../db');

// @route   POST /api/feedback
// @desc    Save new feedback message
exports.saveFeedback = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please provide name, email, and message' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO Feedback (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );

    res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: result.insertId });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Server error while saving feedback' });
  }
};
