# 
<!-- ============================================================
  📸  SCREENSHOTS — Replace these placeholders with your actual images
  Recommended: 1280×800px, drag into GitHub to upload, then paste URL
  ============================================================ -->

<div align="center">

<!-- HERO BANNER — replace src with your own banner/logo image -->
<img src="https://placehold.co/1200x400/0d0d0d/ff4433?text=ReviewDrop+AI&font=montserrat" alt="ReviewDrop Banner" width="100%" />

<br/><br/>

<!-- SCREENSHOT ROW — replace each src with real screenshots -->
| Review Form | Admin Dashboard | Email Notification |
|:-----------:|:---------------:|:-----------------:|
| <img src="https://placehold.co/380x240/f5f2ec/0d0d0d?text=Review+Form" width="380"/> | <img src="https://placehold.co/380x240/0d0d0d/ff4433?text=Admin+Dashboard" width="380"/> | <img src="https://placehold.co/380x240/edf7ed/2d7a2d?text=Email+Sent" width="380"/> |

<br/>

</div>

---

<div align="center">

# 📱 ReviewDrop — AI-Powered Product Review & Complaint Routing System

**A full-stack intelligent feedback pipeline that analyzes customer reviews, detects defect types, routes complaints to the right team, and sends automated notifications via Email + Slack — all powered by a custom-trained ML model.**

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)
![Gmail](https://img.shields.io/badge/Gmail-EA4335?style=for-the-badge&logo=gmail&logoColor=white)

</div>

---

## 📋 Table of Contents

- [What is ReviewDrop?](#-what-is-reviewdrop)
- [How It Works — The Full Pipeline](#-how-it-works--the-full-pipeline)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Slack Integration Guide](#-slack-integration-guide)
- [Gmail OAuth2 Setup](#-gmail-oauth2-setup)
- [ML Model (Python Flask API)](#-ml-model-python-flask-api)
- [API Reference](#-api-reference)
- [Admin Dashboard](#-admin-dashboard)
- [Defect Routing Logic](#-defect-routing-logic)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 What is ReviewDrop?

ReviewDrop is an end-to-end intelligent product review management system built for **Ambilax**, a smartphone company. When a customer submits a review for any phone model (iPhone, Samsung, Pixel, OnePlus, etc.), the system:

1. **Analyzes the sentiment** (Positive / Negative / Neutral) using a custom ML model
2. **Detects the defect type** (Battery, Camera, Display, Heating, etc.)
3. **Routes the complaint** to the correct internal team
4. **Notifies the team** via Slack in the appropriate channel
5. **Emails the customer** automatically — a thank-you for happy customers, an acknowledgment with team info for complaints
6. **Stores everything** in MongoDB for admin review

All of this happens automatically within seconds of a customer clicking **"Send Review"**.

---

## 🔄 How It Works — The Full Pipeline

Here is a step-by-step walkthrough of exactly what happens from the moment a user submits a review:

```
Customer fills form → POST /review → Node.js Backend
        ↓
  ML Flask API (/analyze)
        ↓
  Sentiment: Positive / Negative / Neutral
  Defect Type: Battery / Camera / Display / Heating / General...
  Routed Team: Battery Team / Camera Team / ...
        ↓
  Save to MongoDB
        ↓
  ┌──────────────────────────────┐
  │  Slack Notification          │  → Routes to correct Slack channel
  │  (based on defect type)      │    e.g. #battery-issue, #camera-issue
  └──────────────────────────────┘
        ↓
  ┌──────────────────────────────┐
  │  Email to Customer           │  → Positive: Thank-you email
  │  (based on sentiment)        │  → Negative/Neutral: Acknowledgment
  └──────────────────────────────┘
        ↓
  Response → Frontend shows sentiment, defect, routed team
```

### Step 1 — Customer Submits Review
The customer visits the ReviewDrop frontend (`index.html`), picks their phone from the left panel, fills in their name, email, star rating, and writes their review text, then hits **Send Review**.

### Step 2 — Backend Receives the Request (`POST /review`)
`reviewController.js` receives the request body (`email`, `productName`, `reviewText`, `name`) and immediately forwards the review text and email to the **Python ML service**.

### Step 3 — ML Analysis (`Flask /analyze`)
The Python Flask API (`app.py`) runs the review text through two ML models:
- **Sentiment Model** — classifies as `positive`, `negative`, or `neutral`
- **Defect Model** — if negative/neutral, classifies the defect type (Battery Issue, Camera Issue, Display Issue, Heating Issue, General Complaint, General Inquiry, or None)

The text is cleaned, negation-normalized (`don't` → `NEG_`), and vectorized using the saved TF-IDF vectorizers before prediction.

### Step 4 — Defect-to-Team Routing
Based on the detected defect type, a routing map determines which internal team should handle it:

| Defect Type | Routed Team |
|-------------|-------------|
| None | Customer (positive email only) |
| Heating Issue | Hardware Team |
| Battery Issue | Battery Team |
| Camera Issue | Camera Team |
| Display Issue | Display Team |
| General Complaint | Support Team |
| General Inquiry | Support Team |

### Step 5 — Saved to MongoDB
A new `Review` document is created in MongoDB with all fields: email, productName, reviewText, sentiment, defectType, routedTeam, and status (default: `pending`).

### Step 6 — Slack Notification
The backend maps the routed team name to a Slack channel ID using `slackChannels.js` and posts a structured message to that channel using the Slack Web API. The team is immediately notified with the customer's email, product, review text, and defect type.

### Step 7 — Customer Email
Based on the sentiment:
- **Positive** → `sendPositiveFeedbackThankYou()` — a warm, appreciative email
- **Negative / Neutral / anything else** → `sendComplaintAcknowledgment()` — a professional acknowledgment naming which team is handling the issue

Both emails are dispatched non-blocking (`.catch()` logged, never throws).

### Step 8 — Response to Frontend
The frontend receives the saved review object and renders the sentiment badge, defect type chip, and routed team chip in the results card.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   index.html (Review Form)   admin.html (Dashboard)         │
│   admin-login.html (Auth)                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP (REST)
┌───────────────────▼─────────────────────────────────────────┐
│                  NODE.JS BACKEND (Express)                   │
│                                                              │
│   POST /review          → reviewController.js               │
│   POST /admin/login     → JWT Auth                          │
│   GET  /admin/reviews   → adminRoutes.js (protected)        │
│   PATCH /admin/reviews/:id/status                           │
└──────┬─────────────────────────────┬────────────────────────┘
       │ axios                        │ mongoose
┌──────▼──────────┐          ┌───────▼────────┐
│  PYTHON ML API  │          │    MONGODB     │
│  (Flask :5000)  │          │  reviews coll. │
│                 │          └────────────────┘
│  /analyze       │
│  sentiment_model│          ┌────────────────┐
│  defect_model   │          │  SLACK API     │
│  vectorizers    │          │  (per channel) │
└─────────────────┘          └────────────────┘
                                      │
                             ┌────────▼────────┐
                             │  GMAIL (OAuth2) │
                             │  Customer Emails│
                             └─────────────────┘
```

---

## 📁 Project Structure

```
reviewdrop/
│
├── public/                        # Static frontend files
│   ├── index.html                 # Customer review submission form
│   ├── admin.html                 # Admin dashboard (protected)
│   ├── admin-login.html           # Admin login page
│   └── *.png                      # Brand logo images (apple.png, samsung.png, etc.)
│
├── src/
│   ├── app.js                     # Express app setup, routes, middleware
│   │
│   ├── controller/
│   │   └── review.controller.js   # Core logic: analyze → save → slack → email
│   │
│   ├── model/
│   │   └── review.model.js        # Mongoose schema for reviews
│   │
│   ├── routes/
│   │   └── admin.routes.js        # Admin-only routes (GET reviews, PATCH status)
│   │
│   ├── services/
│   │   ├── email.service.js       # Nodemailer + Gmail OAuth2 email sending
│   │   └── openai.service.js      # Wrapper for ML API (analyzeReview)
│   │
│   ├── utils/
│   │   └── slackChannels.js       # Team → Slack Channel ID mapping
│   │
│   └── db/
│       └── db.js                  # MongoDB connection via Mongoose
│
├── ml/                            # Python ML service (separate process)
│   ├── app.py                     # Flask API exposing /analyze and /batch
│   └── models/
│       ├── sentiment_model.pkl    # Trained sentiment classifier
│       ├── vectorizer_sent.pkl    # TF-IDF vectorizer for sentiment
│       ├── defect_model.pkl       # Trained defect type classifier
│       └── vectorizer_def.pkl     # TF-IDF vectorizer for defects
│
├── server.js                      # Entry point — connects DB, starts server
├── .env                           # Environment variables (never commit this!)
└── package.json
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vanilla HTML/CSS/JS | Review form, Admin dashboard |
| Backend | Node.js + Express | REST API, routing, orchestration |
| Database | MongoDB + Mongoose | Persistent review storage |
| ML Service | Python + Flask | Sentiment & defect classification |
| ML Models | scikit-learn (joblib) | TF-IDF + classifiers |
| Notifications | Slack Web API (`@slack/web-api`) | Team alerts per channel |
| Email | Nodemailer + Gmail OAuth2 | Customer acknowledgment emails |
| Auth | JWT (jsonwebtoken) | Admin dashboard protection |

---

## ✅ Prerequisites

Make sure you have the following installed before starting:

- **Node.js** v18 or above — `node --version`
- **Python** 3.9 or above — `python --version`
- **MongoDB** (local or MongoDB Atlas URI)
- **npm** — `npm --version`
- **pip** — `pip --version`
- A **Slack workspace** where you have permission to create apps
- A **Google account** for Gmail OAuth2

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/reviewdrop.git
cd reviewdrop
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install flask joblib scikit-learn numpy
```

> If you use a virtual environment (recommended):
> ```bash
> python -m venv venv
> source venv/bin/activate        # On Windows: venv\Scripts\activate
> pip install flask joblib scikit-learn numpy
> ```

### 4. Set up your `.env` file

Create a `.env` file in the root directory. See [Environment Variables](#-environment-variables) below for all required values.

### 5. Start the Python ML API

```bash
cd ml
python app.py
```

You should see:
```
✅ Sentiment & Defect models loaded
🚀 Starting Flask API on http://127.0.0.1:5000
```

> Keep this terminal open. The Node.js backend calls this service for every review.

### 6. Start the Node.js backend

In a new terminal, from the project root:

```bash
node server.js
```

You should see:
```
database connected successfully
Email transporter is ready
server is running at port 3000
```

### 7. Open the app

- **Customer form:** `http://localhost:3000` (or open `public/index.html` directly)
- **Admin login:** `http://localhost:3000/admin-login.html`
- **Admin dashboard:** `http://localhost:3000/admin.html` (after login)

---

## 🔑 Environment Variables

Create a file named `.env` in the project root with the following keys:

```env
# ── MongoDB ──────────────────────────────────────────────────
MONGOOSE_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/reviewdrop

# ── JWT (Admin Auth) ─────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random

# ── Admin Login Credentials ──────────────────────────────────
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=YourStrongAdminPassword123

# ── Gmail OAuth2 (for sending emails) ────────────────────────
EMAIL_USER=yourgmail@gmail.com
CLIENT_ID=your_google_client_id.apps.googleusercontent.com
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_gmail_refresh_token

# ── Slack ─────────────────────────────────────────────────────
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token

# ── Python ML API ─────────────────────────────────────────────
ML_API_URL=http://127.0.0.1:5000
```

> ⚠️ **Never commit your `.env` file.** Add it to `.gitignore` immediately.

---

## 💬 Slack Integration Guide

This is the most involved part of the setup. Follow each step carefully.

### Step 1 — Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → choose **"From Scratch"**
3. Give it a name (e.g. `ReviewDrop Bot`) and select your workspace
4. Click **Create App**

### Step 2 — Add Bot Token Scopes

1. In the left sidebar, go to **OAuth & Permissions**
2. Scroll down to **Bot Token Scopes**
3. Click **"Add an OAuth Scope"** and add the following:

| Scope | Why it's needed |
|-------|-----------------|
| `chat:write` | Post messages to channels |
| `chat:write.public` | Post to public channels without being a member |

### Step 3 — Install the App to Your Workspace

1. Still on the **OAuth & Permissions** page
2. Scroll up and click **"Install to Workspace"**
3. Authorize the app
4. Copy the **Bot User OAuth Token** — it starts with `xoxb-`
5. Paste it into your `.env` as `SLACK_BOT_TOKEN`

### Step 4 — Create Slack Channels

Create the following channels in your Slack workspace (you can name them anything, but these match the defaults):

| Channel Name | Purpose |
|---|---|
| `#hardware-issue` | Heating / hardware complaints |
| `#battery-issue` | Battery complaints |
| `#camera-issue` | Camera complaints |
| `#display-issue` | Screen / display complaints |
| `#support-team` | General complaints, inquiries, fallback |

### Step 5 — Add the Bot to Each Channel

For **every channel** you created:
1. Open the channel in Slack
2. Type `/invite @ReviewDrop Bot` (use your bot's name)
3. Or: click the channel name → **Integrations** → **Add apps**

> The bot must be a member of the channel to post messages. This is the most common reason Slack notifications fail.

### Step 6 — Get Channel IDs

You need the **Channel ID** (not the name) for each channel:

1. Open Slack in your **browser** (not the app)
2. Click on a channel
3. Look at the URL — it looks like: `https://app.slack.com/client/T0XXXXXX/`**`C0AG90SGQKF`**
4. The part starting with `C0...` is the Channel ID

Alternatively:
1. Click on the channel name to open its details
2. Scroll to the bottom of the "About" section
3. The Channel ID is shown there

### Step 7 — Update `slackChannels.js`

Open `src/utils/slackChannels.js` and replace the placeholder channel IDs with your real ones:

```javascript
const TEAM_TO_CHANNEL = {
  hardware:        'C0AG90SGQKF',   // ← your #hardware-issue channel ID
  camera:          'C0AGRASGTPB',   // ← your #camera-issue channel ID
  battery:         'C0AGCD05GRY',   // ← your #battery-issue channel ID
  display:         'C0AGRATQJQH',   // ← your #display-issue channel ID
  support:         'C0AGG1S9LMA',   // ← your #support-team channel ID

  'hardware team': 'C0AG90SGQKF',
  'camera team':   'C0AGRASGTPB',
  'battery team':  'C0AGCD05GRY',
  'display team':  'C0AGRATQJQH',
  'support team':  'C0AGG1S9LMA',

  default:         'C0AGG1S9LMA',   // fallback — support team
};
```

### Step 8 — Test It

Submit a test review with negative sentiment (e.g. *"My phone battery dies in 2 hours, it's terrible"*). You should see a message appear in `#battery-issue` within seconds.

---

## 📧 Gmail OAuth2 Setup

ReviewDrop uses Gmail with OAuth2 (not an app password) for secure, reliable email delivery.

### Step 1 — Create Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. `ReviewDrop`)
3. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable

### Step 2 — Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External**, click Create
3. Fill in App name, support email, developer email
4. Add scope: `https://mail.google.com/`
5. Add your Gmail as a **Test User**

### Step 3 — Create OAuth2 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Add `https://developers.google.com/oauthplayground` to **Authorized redirect URIs**
5. Click Create — download the JSON or copy the **Client ID** and **Client Secret**

### Step 4 — Get Refresh Token

1. Go to [https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Click the gear icon (⚙️) in the top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In the left panel, scroll to **Gmail API v1** → select `https://mail.google.com/`
6. Click **Authorize APIs** and sign in with your Gmail
7. Click **Exchange authorization code for tokens**
8. Copy the **Refresh Token**

### Step 5 — Add to `.env`

```env
EMAIL_USER=yourgmail@gmail.com
CLIENT_ID=xxxx.apps.googleusercontent.com
CLIENT_SECRET=GOCSPX-xxxxxxxxxx
REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxx
```

---

## 🤖 ML Model (Python Flask API)

The Flask service exposes three endpoints:

### `GET /health`
Returns `{"status": "ok", "models_loaded": true}` — use this to verify the ML service is running.

### `POST /analyze`
Analyzes a single review.

**Request:**
```json
{
  "reviewText": "The battery drains really fast, very disappointed",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "sentiment": "negative",
  "sentimentConfidence": 94.2,
  "defectType": "Battery Issue",
  "defectConfidence": 87.5,
  "routedTeam": "Battery Team",
  "topSentiments": [...],
  "topDefects": [...]
}
```

### `POST /batch`
Analyzes multiple reviews at once. Send an array of `{ reviewText, userEmail }` objects.

### Text Preprocessing

The ML pipeline applies this cleaning before prediction:
1. Lowercases all text
2. Normalizes negations (`don't` → `not`, `can't` → `not`, etc.)
3. Removes all non-alphabetic characters
4. Tags words following `not` with `NEG_` prefix (e.g. `not good` → `not NEG_good`)
5. Applies TF-IDF vectorization using the saved vectorizer

> The preprocessing in `app.py` must exactly match the preprocessing used during model training in your Colab notebook.

---

## 📡 API Reference

### Public Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/review` | Submit a review | None |

**Request Body:**
```json
{
  "email": "customer@example.com",
  "productName": "Samsung Galaxy S25 Ultra",
  "reviewText": "The camera is blurry in low light, very frustrating",
  "name": "John Doe",
  "rating": 2
}
```

### Admin Routes (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/login` | Login and get JWT token |
| `GET` | `/admin/reviews` | Get all reviews (newest first) |
| `PATCH` | `/admin/reviews/:id/status` | Update review status |

**Login Request:**
```json
{
  "email": "admin@example.com",
  "password": "YourAdminPassword"
}
```

**Status Update Request:**
```json
{
  "status": "in-progress"
}
```
Valid status values: `pending`, `in-progress`, `resolved`

---

## 🖥 Admin Dashboard

The admin dashboard (`admin.html`) provides:

- **Stats overview** — total reviews, positive/negative/neutral counts, pending count
- **Full review table** — sortable, searchable, paginated (15 per page)
- **Filter by sentiment** — All / Positive / Negative / Neutral
- **Filter by status** — All Status / Pending / In Progress / Resolved
- **Review detail modal** — click any row to see full review text, all metadata, and update status
- **Real-time status updates** — change a review's status and it saves instantly via PATCH

### Accessing the Admin Panel

1. Go to `http://localhost:3000/admin-login.html`
2. Use the credentials you set in `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
3. A JWT token is stored in `sessionStorage` for the 8-hour session

---

## 🗺 Defect Routing Logic

The routing follows this decision tree:

```
Sentiment = positive?
    └── YES → defectType = "None", routedTeam = customerEmail (no complaint)
Sentiment = neutral?
    └── YES → run defect model → usually "General Inquiry" → Support Team
Sentiment = negative?
    └── YES → run defect model:
              Battery Issue   → Battery Team   → #battery-issue
              Camera Issue    → Camera Team    → #camera-issue
              Display Issue   → Display Team   → #display-issue
              Heating Issue   → Hardware Team  → #hardware-issue
              General Complaint → Support Team → #support-team
              General Inquiry   → Support Team → #support-team
```

The Slack channel lookup first tries the normalized team key (with "team" stripped), then falls back to the `default` channel (Support Team) if no match is found.

---

## 🐛 Troubleshooting

**ML API not responding**
- Make sure `python app.py` is running in the `ml/` directory
- Check that all four `.pkl` model files exist in `ml/models/`
- Verify `ML_API_URL=http://127.0.0.1:5000` in your `.env`

**Slack notifications not arriving**
- Confirm the bot is **invited to the channel** (`/invite @YourBotName`)
- Double-check that the Channel IDs in `slackChannels.js` are correct (they start with `C0...`)
- Verify `SLACK_BOT_TOKEN` starts with `xoxb-` and is in your `.env`
- Check the Node.js console for `Slack failed:` error messages

**Emails not sending**
- The Refresh Token expires if the app is in "testing" mode for too long — regenerate it at OAuth Playground
- Make sure `https://mail.google.com/` scope is authorized
- Check for `Email transporter verification failed:` in the console on startup

**Admin login fails**
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` match exactly what you set in `.env`
- Ensure `JWT_SECRET` is set (any long random string)

**MongoDB connection error**
- Check your `MONGOOSE_URI` — if using Atlas, ensure your IP is whitelisted in Network Access
- For local MongoDB, make sure the `mongod` service is running

---

## 📄 License

This project is proprietary to Ambilax Company. All rights reserved.

---

<div align="center">

Built with ❤️ by the AL Binod

**ReviewDrop** — *Turning feedback into action*

</div>
