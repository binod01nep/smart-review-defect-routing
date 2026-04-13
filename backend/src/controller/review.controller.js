// controllers/reviewController.js

const ReviewModel = require("../model/review.model");
const { analyzeReview } = require("../services/openai.service");
const {
  sendComplaintAcknowledgment,
  sendPositiveFeedbackThankYou,
} = require("../services/email.service");
require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const { TEAM_TO_CHANNEL } = require('../utils/slackChannels');

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

exports.createReview = async (req, res) => {
  try {
    const { email, productName, reviewText, name } = req.body;

    if (!email || !productName || !reviewText) {
      return res.status(400).json({
        message: "Email, product name, and review text are required",
      });
    }

    const aiResult = await analyzeReview(reviewText, email);

    console.log("AI Result:", aiResult);

    const newReview = await ReviewModel.create({
      email,
      productName,
      reviewText,
      sentiment: aiResult.sentiment,
      defectType: aiResult.defectType,
      routedTeam: aiResult.routedTeam,
      status: "pending",
    });

    console.log("New review created →", newReview.email, newReview.productName, newReview.routedTeam);

    // ────────────────────── Slack notification ──────────────────────
    const routedTeamRaw = (newReview.routedTeam || "").trim();
    console.log("Raw routedTeam:", routedTeamRaw);

    const normalized = routedTeamRaw
      .toLowerCase()
      .replace(/\s*team\s*/gi, '')
      .replace(/\s+/g, '')
      .trim();

    console.log("Normalized team for lookup:", normalized);

    let channelId = TEAM_TO_CHANNEL[normalized];

    if (!channelId) {
      const exactKey = routedTeamRaw.toLowerCase();
      channelId = TEAM_TO_CHANNEL[exactKey];
    }

    if (!channelId) {
      channelId = TEAM_TO_CHANNEL.default;
      console.warn(`No exact match for "${routedTeamRaw}" → using default channel`);
    }

    if (channelId) {
      try {
        const message = `
*New Complaint Routed*
• Product: ${newReview.productName}
• Email: ${newReview.email}
• Review: ${newReview.reviewText}
• Defect: ${newReview.defectType}
        `.trim();

        await slack.chat.postMessage({
          channel: channelId,
          text: message,
          mrkdwn: true,
        });

        console.log(`Slack sent successfully to ${channelId}`);
      } catch (slackErr) {
        console.error("Slack failed:", slackErr.message);
      }
    }
    // ────────────────────────────────────────────────────────────────

    // ────────────────────── Customer Email (conditional) ──────────────────────
    const sentiment = (newReview.sentiment || '').toString().toLowerCase().trim();

    const customerName = name || "Customer";

    // Non-blocking email dispatch
    if (sentiment === 'positive') {
      sendPositiveFeedbackThankYou(customerEmail = email, customerName, productName)
        .catch(err => console.error("Positive thank-you email failed:", err.message));
    } else {
      // negative, neutral, mixed, empty, or any other value → acknowledgment
      sendComplaintAcknowledgment(
        email,
        customerName,
        productName,
        newReview.routedTeam || "Support"
      ).catch(err => console.error("Acknowledgment email failed:", err.message));
    }
    // ────────────────────────────────────────────────────────────────

    res.status(201).json({
      message: "Review Stored Successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};