from flask import Flask, request, jsonify
import joblib
import os
import re
import numpy as np

app = Flask(__name__)

# ── Load models and vectorizers ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

sentiment_model = joblib.load(os.path.join(MODEL_DIR, 'sentiment_model.pkl'))
vectorizer_sent = joblib.load(os.path.join(MODEL_DIR, 'vectorizer_sent.pkl'))

defect_model = joblib.load(os.path.join(MODEL_DIR, 'defect_model.pkl'))
vectorizer_def = joblib.load(os.path.join(MODEL_DIR, 'vectorizer_def.pkl'))

DEFECT_TO_TEAM = {
    'None': 'useremail',
    'Heating Issue': 'Hardware Team',
    'Battery Issue': 'Battery Team',
    'Camera Issue': 'Camera Team',
    'Display Issue': 'Display Team',
    'General Complaint': 'Support Team',
    'General Inquiry': 'Support Team',
}

# ── Text preprocessing (MUST match Colab training) ─────────────────────────
def clean_text(text):
    text = str(text).lower()
    # Normalise negations
    text = re.sub(r"don't|dont", " not ", text)
    text = re.sub(r"doesn't|doesnt", " not ", text)
    text = re.sub(r"didn't|didnt", " not ", text)
    text = re.sub(r"can't|cant", " not ", text)
    text = re.sub(r"won't|wont", " not ", text)
    text = re.sub(r"isn't|isnt", " not ", text)
    text = re.sub(r"aren't|arent", " not ", text)
    # Remove non-letters
    text = re.sub(r"[^a-z\s]", ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Mark words after "not" with NEG_
    words = text.split()
    result = []
    negate = False
    for w in words:
        if w == 'not':
            negate = True
            result.append(w)
        elif negate:
            result.append('NEG_' + w)
            negate = False
        else:
            result.append(w)
    return ' '.join(result)

def predict_full(review_text: str, user_email: str = ''):
    """Run both models and return full prediction dict."""
    text = str(review_text).strip()
    cleaned = clean_text(text)

    # ── Sentiment ────────────────────────────────────────────────────────────
    sent_vec = vectorizer_sent.transform([cleaned])
    sent_proba = sentiment_model.predict_proba(sent_vec)[0]
    sent_labels = sentiment_model.classes_
    sent_idx = int(np.argmax(sent_proba))
    sentiment = sent_labels[sent_idx]
    sent_conf = round(float(sent_proba[sent_idx]) * 100, 2)
    top_sentiments = [
        {"label": sent_labels[i], "confidence": round(float(sent_proba[i]) * 100, 2)}
        for i in np.argsort(sent_proba)[::-1]
    ]

    # ── Defect ───────────────────────────────────────────────────────────────
    if sentiment == 'positive':
        defect_type = 'None'
        defect_conf = 100.0
        top_defects = [{"label": "None", "confidence": 100.0}]
    elif sentiment == 'neutral':
        # Neutral reviews default to General Inquiry
        try:
            def_vec = vectorizer_def.transform([cleaned])
            def_proba = defect_model.predict_proba(def_vec)[0]
            def_labels = defect_model.classes_
            def_idx = int(np.argmax(def_proba))
            defect_type = def_labels[def_idx]
            defect_conf = round(float(def_proba[def_idx]) * 100, 2)
            top_defects = [
                {"label": def_labels[i], "confidence": round(float(def_proba[i]) * 100, 2)}
                for i in np.argsort(def_proba)[::-1]
            ]
        except Exception:
            defect_type = 'General Inquiry'
            defect_conf = 90.0
            top_defects = [{"label": "General Inquiry", "confidence": 90.0}]
    else:  # negative
        def_vec = vectorizer_def.transform([cleaned])
        def_proba = defect_model.predict_proba(def_vec)[0]
        def_labels = defect_model.classes_
        def_idx = int(np.argmax(def_proba))
        defect_type = def_labels[def_idx]
        defect_conf = round(float(def_proba[def_idx]) * 100, 2)
        top_defects = [
            {"label": def_labels[i], "confidence": round(float(def_proba[i]) * 100, 2)}
            for i in np.argsort(def_proba)[::-1]
        ]

    # ── Routing ──────────────────────────────────────────────────────────────
    base_team = DEFECT_TO_TEAM.get(defect_type, 'Support Team')
    routed_team = user_email if base_team == 'useremail' else base_team

    return {
        "success": True,
        "reviewText": text,
        "sentiment": sentiment,
        "sentimentConfidence": sent_conf,
        "topSentiments": top_sentiments,
        "defectType": defect_type,
        "defectConfidence": defect_conf,
        "topDefects": top_defects,
        "routedTeam": routed_team,
        "model_raw_prediction": sentiment,
    }

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "models_loaded": True}), 200

@app.route('/analyze', methods=['POST'])
def analyze():
    body = request.get_json(silent=True) or {}
    review_text = body.get('reviewText', '').strip()
    user_email = body.get('userEmail', '').strip()

    if not review_text:
        return jsonify({"success": False, "error": "reviewText is required"}), 400

    try:
        result = predict_full(review_text, user_email)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/batch', methods=['POST'])
def batch_analyze():
    body = request.get_json(silent=True) or {}
    reviews = body.get('reviews', [])

    if not isinstance(reviews, list) or len(reviews) == 0:
        return jsonify({"success": False, "error": "reviews array is required"}), 400

    results = []
    for item in reviews:
        text = str(item.get('reviewText', '')).strip()
        email = str(item.get('userEmail', '')).strip()
        if text:
            results.append(predict_full(text, email))
        else:
            results.append({"success": False, "error": "empty reviewText"})

    return jsonify({"success": True, "results": results}), 200

if __name__ == '__main__':
    print("✅ Sentiment & Defect models loaded")
    print("🚀 Starting Flask API on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)