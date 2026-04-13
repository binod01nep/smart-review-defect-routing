const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  productName: {
    type: String,
    required: true,
    trim: true
  },

  reviewText: {
    type: String,
    required: true
  },

  sentiment: {
    type: String,
    enum: ["positive", "negative", "neutral"],
    default: null
  },

  defectType: {
    type: String,
    default: null
  },

  routedTeam: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved"],
    default: "pending"
  }

}, { timestamps: true });

const reviewModel = mongoose.model("Review", reviewSchema);
module.exports=reviewModel;
