// services/email.service.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify transporter on startup (for debugging)
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error.message);
  } else {
    console.log('Email transporter is ready');
  }
});

/**
 * Generic email sender
 */
async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Ambilax Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to} → Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Email for NEGATIVE / NEUTRAL / MIXED feedback or complaints
 */
async function sendComplaintAcknowledgment(
  customerEmail,
  customerName = 'Customer',
  productName,
  routedTeam
) {
  // ─── FIXED: Prevent "Team Team" duplication ───────────────────────────────
  let cleanedTeam = (routedTeam || 'Support')
    .trim()
    .replace(/\s*team\s*$/i, '')           // remove trailing "team", " Team", etc.
    .replace(/\s+/g, ' ')                  // normalize multiple spaces
    .trim();

  const teamName = cleanedTeam === '' || cleanedTeam.toLowerCase() === 'support'
    ? 'Support'
    : `${cleanedTeam} Team`;
  // ────────────────────────────────────────────────────────────────────────

  const subject = `We've Received Your Feedback About ${productName}`;

  const text = `Dear ${customerName},

Thank you for taking the time to share your feedback about ${productName}.

We’re truly sorry for the inconvenience you’ve experienced. 
Your review has been forwarded to our ${teamName} — they will carefully look into this matter and get back to you as soon as possible (usually within 24–72 hours).

If you have any additional details or photos, feel free to reply to this email.

Thank you for helping us improve.

Best regards,
The ${teamName} Team
Ambilax Company`;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2c3e50;">We've Received Your Feedback</h2>
  
  <p>Dear ${customerName},</p>
  
  <p>Thank you for taking the time to share your experience with <strong>${productName}</strong>.</p>
  
  <p style="color: #e74c3c; font-weight: bold;">We’re genuinely sorry for the inconvenience caused.</p>
  
  <p>Your feedback has been automatically routed to our <strong>${teamName}</strong>. 
  They will investigate the issue thoroughly and will reach out to you soon (typically within 1–3 business days).</p>

  <p>If you have photos, order numbers, or any other details that could help us resolve this faster, please reply directly to this email.</p>

  <p style="margin-top: 30px;">Thank you again for your honesty — it helps us get better.</p>

  <p>Best regards,<br>
  <strong>The ${teamName} Team</strong><br>
  Ambilax Company</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <small style="color: #777;">This is an automated message. Please do not reply to report new issues — use our support form instead.</small>
</div>`;

  await sendEmail(customerEmail, subject, text, html);
}

/**
 * Email for POSITIVE feedback
 */
async function sendPositiveFeedbackThankYou(
  customerEmail,
  customerName = 'Customer',
  productName
) {
  const subject = `Thank You for Your Wonderful Feedback on ${productName}!`;

  const text = `Dear ${customerName},

Thank you so much for your kind words and positive feedback about ${productName}!

Hearing that our customers are happy and satisfied truly means the world to us. Your support motivates the entire Ambilax team to keep delivering great products and experiences.

We really appreciate you taking the time to share your thoughts — it helps us grow and shows others what they can expect.

If you ever need anything or want to tell us more, just reply to this email. We'd love to hear from you again!

With gratitude,  
The Ambilax Team  
Ambilax Company`;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2c3e50;">Thank You for the Amazing Feedback!</h2>
  
  <p>Dear ${customerName},</p>
  
  <p>Wow — thank you so much for your positive review of <strong>${productName}</strong>!</p>
  
  <p style="color: #27ae60; font-weight: bold; font-size: 1.1em;">
    Your kind words truly made our day ❤️
  </p>
  
  <p>Knowing that you're happy with your experience motivates us every day to keep improving and innovating. Feedback like yours is incredibly valuable — it helps us understand what we're doing right and inspires the whole Ambilax team.</p>

  <p>Thank you again for choosing us and for sharing your thoughts. It means a lot!</p>

  <p style="margin-top: 30px;">We'd love to hear from you anytime — just hit reply if there's anything else on your mind.</p>

  <p>Warm regards,<br>
  <strong>The Ambilax Team</strong><br>
  Ambilax Company</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <small style="color: #777;">This is an automated message. We're always here if you need us!</small>
</div>`;

  await sendEmail(customerEmail, subject, text, html);
}

module.exports = {
  sendEmail,
  sendComplaintAcknowledgment,
  sendPositiveFeedbackThankYou,
};