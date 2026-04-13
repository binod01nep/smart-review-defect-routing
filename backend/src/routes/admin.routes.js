// routes/admin.routes.js  (or add directly into app.js)

const express = require('express');
const router = express.Router();
const ReviewModel = require('../model/review.model'); // adjust path if needed

// GET all reviews (sorted newest first)
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await ReviewModel.find({}).sort({ createdAt: -1 });
    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Admin fetch error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PATCH update review status
router.patch('/reviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'in-progress', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updated = await ReviewModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Review not found' });

    res.status(200).json({ message: 'Status updated', review: updated });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;