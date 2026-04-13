const axios = require('axios');
const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';

async function analyzeReview(reviewText, userEmail = '') {
  const response = await axios.post(`${ML_API_URL}/analyze`, {
    reviewText: reviewText.trim(),
    userEmail: userEmail.trim(),
  }, { timeout: 7000 });

  return response.data;
}

module.exports = { analyzeReview };