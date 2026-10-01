# Explaining SupportIQ to your manager

## A short introduction

“SupportIQ turns complaint records into a searchable support workspace. Customers submit feedback through UrbanBite's portal. The backend saves each ticket, predicts its likely issue and sentiment, assigns a vocabulary cluster, and retrieves similar historical complaints. The admin dashboard displays real database totals rather than mock numbers.”

## The files to explain first

1. `ml/inspect_dataset.py`: reads the real CSV schema and reports quality. Explain why one top-level category was not a useful multi-class target.
2. `ml/preprocess.py`: maps actual source columns into consistent names. Raw text remains available alongside lowercase cleaned text.
3. `ml/train_intent.py`: TF-IDF → train/test split → Logistic Regression → metrics → Joblib. Explain the repeated-descriptor limitation before showing the high score.
4. `ml/domain_rules.py`: a few clearly visible restaurant phrase rules bridge cold food to the historical temperature vocabulary. These rules are manually authored.
5. `app/services/ml_service.py`: the reusable `predict_intent`, `predict_sentiment`, `assign_cluster`, and `find_similar_complaints` functions. Models are reused after startup.
6. `app/models.py`: the two simple database tables. Source category and derived intent are different fields.
7. `app/services/complaint_service.py`: validate through the request schema, analyze, generate a reference, save, return confirmation.
8. `app/auth.py`: Argon2 verifies passwords; signed, expiring JWTs protect API access. The keyboard shortcut alone does not secure anything.
9. `frontend/src/services/api.js`: all HTTP calls in one place.
10. `frontend/src/pages/Dashboard.jsx`: fetches backend metrics and passes real values to charts.

## Explain the algorithms in ordinary language

**TF-IDF:** A word gets more weight when it helps distinguish a complaint from the other records. We turn each complaint into a list of numeric word weights.

**Logistic Regression:** It learns a weight for each word and category, then chooses a likely category. With this limited dataset it mainly recognizes descriptors; uncertain messages need review.

**VADER:** A dictionary and rules estimate emotional polarity. It is not trained on these NYC complaints. Administrative language can sound neutral even when the issue is serious.

**Cosine similarity:** Compare the directions of two word-weight vectors. A larger score means more shared weighted vocabulary; it does not prove the incidents are equivalent.

**K-Means:** Repeatedly move group centers toward their assigned complaints. Similar vocabulary tends to land near the same center. Here the group boundaries are weak, so the clusters are an exploratory aid.

## Demonstration order

Show the public form → submit the late/cold food example → ticket confirmation → hold Command/Ctrl and press A then B → login → new ticket on the dashboard → analysis and similar cases → update status → analytics → clusters → interactive similarity search.

The example illustrates a manually expanded temperature signal, not a delivery classifier. All historical matches are actual source records. Their similarity percentages should be described as word overlap.

## Useful questions and honest answers

**Why PostgreSQL?** It supports a shared persistent database for the deployed API. SQLite makes local setup easy; the same SQLAlchemy models work with both.

**Why not deep learning?** The project intentionally demonstrates classical NLP with inexpensive, explainable algorithms and a small vocabulary.

**Why 100% accuracy?** The held-out rows repeat the same short descriptors as training. It is a reconstruction score, not real-world language accuracy. A stronger project evaluation needs new, independently labeled narratives.

**Why are some complaints neutral?** VADER reads sentiment words, not health risk. A phrase such as Letter Grading has little emotional language.

**What happens when ML fails?** The complaint is saved, unavailable fields remain empty, and the admin sees an analysis warning.

**What happens after another import?** Existing external IDs are skipped; there is no automatic startup import or status overwrite.

**What would you improve next?** Collect independent labeled narratives, evaluate on them, calibrate probabilities, version models and stored predictions, improve timezone handling, and add shared throttling before wider public deployment.
