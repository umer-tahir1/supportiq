You are building a complete end-to-end SaaS-style MVP called **SupportIQ – Intelligent Customer Support & Feedback Analysis System**.

This project is for a university internship final Star Project, so the application must look professional and modern, but the source code must remain simple, beginner-friendly, human-readable, and easy for me to explain to my manager.

Do NOT over-engineer the project.

Do NOT write unnecessarily advanced patterns.

Do NOT use complicated abstractions unless genuinely required.

Write clean code with meaningful variable names and natural human comments.

I want to be able to open every important file and explain what the code is doing.

---

# PROJECT IDEA

SupportIQ is a customer-support intelligence platform for a food/restaurant-related organization.

The system has two main sides:

1. Customer Complaint Portal
2. Admin Analytics Dashboard

Customers will normally only see the complaint portal.

The admin dashboard must NOT appear in normal navigation.

A hidden keyboard shortcut will reveal the admin login.

On macOS:

Command + A + B

On Windows/Linux:

Ctrl + A + B

When this keyboard combination is detected, open the admin login page/modal.

After successful admin login, the admin should enter the private dashboard.

Do not expose the dashboard link visibly on the customer portal.

---

# CURRENT DATASET

I already downloaded the NYC restaurant complaint dataset and placed it inside the project folder.

Before doing anything else:

1. Inspect the project directory.
2. Find the CSV dataset.
3. Read its real column names.
4. Inspect sample rows.
5. Determine which columns are useful.
6. Do NOT assume column names before inspecting the dataset.
7. Adapt the implementation to the actual dataset.

Use this dataset as the historical customer complaint data for our demo food company.

The system should treat these records as the company's historical complaint records.

Do not invent thousands of fake complaints when real dataset records are already available.

---

# MAIN PRODUCT FLOW

The system should work like this:

Historical NYC complaint dataset
        |
        v
Data Cleaning / Preprocessing
        |
        v
NLP + Classical ML Analysis
        |
        v
PostgreSQL/database
        |
        v
Admin Dashboard

At the same time:

Customer Complaint Portal
        |
        v
Customer submits a new complaint
        |
        v
FastAPI receives it
        |
        v
Complaint saved in database
        |
        v
ML/NLP pipeline analyzes it
        |
        +--> Intent/category prediction
        +--> Sentiment prediction
        +--> Similar historical complaints
        +--> Cluster assignment
        |
        v
Complaint appears immediately in admin dashboard

---

# TECH STACK

Frontend:

- React
- Vite
- Tailwind CSS
- shadcn/ui if useful
- Recharts for charts
- React Router

Backend:

- Python
- FastAPI
- Pydantic
- SQLAlchemy

Database:

- PostgreSQL

For local development, if PostgreSQL configuration blocks initial development, SQLite may temporarily be supported through configuration, but PostgreSQL must be the intended final database.

Machine Learning / NLP:

- Pandas
- NumPy
- Scikit-learn
- NLTK if required
- TF-IDF
- Logistic Regression or Linear SVM for classification
- K-Means
- Cosine similarity
- Joblib

Deployment-ready structure:

- Frontend suitable for Vercel
- FastAPI suitable for Render/Railway or another Python host
- PostgreSQL hosted separately
- Docker support

---

# IMPORTANT CODING STYLE

This requirement is extremely important.

Write beginner-friendly code.

I have to explain this project personally.

Avoid things like:

- unnecessary design patterns
- excessive helper classes
- complicated decorators
- unnecessary metaprogramming
- deeply nested abstraction layers
- giant one-line expressions
- clever code that is hard to understand

Prefer code like:

```python
complaint_text = complaint.text
prediction = intent_model.predict([complaint_text])
```

instead of overly abstract pipelines that hide everything.

Use functions with obvious names, for example:

```python
clean_text()
predict_sentiment()
predict_intent()
find_similar_complaints()
assign_cluster()
calculate_dashboard_metrics()
```

Add comments where they help understanding.

Comments should sound natural, for example:

```python
# Clean the complaint text before passing it to the ML model
```

not comments on every single obvious line.

Keep files reasonably small.

Separate responsibilities logically.

---

# PROJECT STRUCTURE

Create something close to:

supportiq/

backend/
    app/
        main.py
        database.py
        models.py
        schemas.py
        auth.py

        routes/
            auth.py
            complaints.py
            dashboard.py
            tickets.py
            ml.py

        services/
            complaint_service.py
            dashboard_service.py
            ml_service.py

    ml/
        inspect_dataset.py
        preprocess.py
        train_intent.py
        train_sentiment.py
        train_clusters.py
        similarity.py
        train_all.py

    saved_models/
        intent_model.joblib
        intent_vectorizer.joblib
        sentiment_model.joblib
        sentiment_vectorizer.joblib
        cluster_model.joblib
        cluster_vectorizer.joblib

    data/
        processed/

    requirements.txt

frontend/
    src/
        components/
        pages/
        layouts/
        services/
        hooks/

        pages/
            ComplaintPortal.jsx
            AdminLogin.jsx
            Dashboard.jsx
            Tickets.jsx
            TicketDetails.jsx
            Analytics.jsx
            Clusters.jsx
            SimilarCases.jsx

        App.jsx
        main.jsx

docker-compose.yml

README.md

.env.example

Use the existing project structure if one already exists instead of unnecessarily rebuilding everything.

---

# STEP 1 — DATASET INSPECTION

First inspect the NYC dataset.

Create a script or notebook-like Python file that prints:

- shape
- column names
- first 5 rows
- missing values
- duplicate count
- unique complaint categories
- useful text columns
- useful date columns
- useful location columns

Then identify the best fields that correspond to concepts such as:

- complaint ID
- complaint description/problem
- category/type
- created date
- closed date
- location
- restaurant/business information
- status

Do not force these names if the source dataset uses something different.

Create a cleaned internal standardized dataframe with columns such as:

ticket_id
created_at
complaint_text
complaint_type
business_name
location
status
closed_at
source

Only create fields supported by the dataset.

If business_name does not exist, do not invent a fake business name per row.

We can use our demo company branding in the UI while keeping historical records truthful to the dataset.

---

# STEP 2 — DATA CLEANING

Implement a simple preprocessing pipeline.

For complaint text:

- convert to lowercase
- remove unnecessary punctuation
- remove excessive whitespace
- handle missing text
- optionally remove stopwords if it improves performance

Do not perform overly aggressive preprocessing.

Preserve both:

raw complaint text

and

cleaned complaint text

Handle:

- missing values
- duplicate records
- malformed dates
- empty complaint descriptions

Save the processed dataset.

---

# STEP 3 — INTENT / COMPLAINT CATEGORY MODEL

We need an intent classifier.

The complaint category/type available in the dataset should act as the target label if suitable.

Before training:

1. inspect unique labels
2. count samples per class
3. remove or merge extremely rare categories where necessary
4. clearly document what was done

Use:

TF-IDF

plus either:

Logistic Regression

or

LinearSVC

Prefer Logistic Regression if it allows easier probability/confidence display.

Use:

train_test_split

Then evaluate using:

- accuracy
- precision
- recall
- F1 score
- classification report
- confusion matrix if useful

Save:

intent model

and

TF-IDF vectorizer

using Joblib.

---

# STEP 4 — SENTIMENT ANALYSIS

We need:

Positive
Neutral
Negative

If the NYC dataset does not contain sentiment labels, do NOT falsely claim that it does.

Use a sensible classical/NLP approach.

For an MVP, you may:

- generate sentiment labels using a transparent rule-based approach such as VADER
- then clearly document that these are derived sentiment labels

or use another lightweight method that is easy to explain.

The dashboard must distinguish:

Dataset-provided information

versus

SupportIQ-derived ML/NLP analysis.

Save any required sentiment model/components.

Create a reusable function:

```python
predict_sentiment(text)
```

Return:

- sentiment label
- score/confidence if available

---

# STEP 5 — SIMILAR COMPLAINTS

Use:

TF-IDF

plus

Cosine Similarity

For every new complaint:

1. clean the text
2. transform it with the TF-IDF vectorizer
3. compare it against historical complaint vectors
4. return the top 5 most similar historical complaints

Return:

- ticket ID
- complaint text
- complaint category
- similarity percentage

Create an easy-to-read function:

```python
find_similar_complaints(text, top_n=5)
```

Do not use embeddings or deep learning.

This project intentionally focuses on Classical ML and NLP.

---

# STEP 6 — K-MEANS CLUSTERING

Use K-Means to discover recurring complaint groups.

Use TF-IDF features.

Experiment with a reasonable number of clusters.

You may use:

- elbow method
- silhouette score

to help choose K.

Keep the explanation simple.

For each cluster generate:

- cluster ID
- number of complaints
- most common words
- example complaints
- dominant complaint categories

Give clusters human-readable display labels where possible.

For example:

Cluster 0
Late Delivery / Delivery Problems

Cluster 1
Food Quality Complaints

Cluster 2
Service Experience

Do not hard-code these exact labels before inspecting cluster keywords.

Assign historical complaints a cluster_id.

New complaints should also be assignable to their nearest cluster.

---

# STEP 7 — DATABASE

Create database tables similar to:

users

- id
- email
- password_hash
- role
- created_at

complaints

- id
- external_ticket_id
- complaint_text
- cleaned_text
- complaint_type
- predicted_intent
- intent_confidence
- sentiment
- sentiment_score
- cluster_id
- status
- location
- source
- created_at
- closed_at

The exact fields can be adjusted based on real dataset columns.

Add a field indicating:

source = "historical_dataset"

or:

source = "customer_portal"

This is important because the admin should be able to distinguish old imported records from new live customer complaints.

---

# STEP 8 — IMPORT HISTORICAL DATA

Create a reusable import script.

It should:

1. load the cleaned historical dataset
2. avoid duplicate imports
3. run SupportIQ analysis
4. insert complaints into the database
5. store predicted sentiment
6. store cluster
7. store any other useful derived values

Do NOT reinsert the same dataset every time the API starts.

Create an explicit import command/script.

---

# STEP 9 — CUSTOMER COMPLAINT PORTAL

This is the public home page.

Branding:

SupportIQ demo organization can be called:

UrbanBite Foods

unless an existing name already exists in the project.

The portal should look like a real food-company support page.

Design should be clean, minimal, premium, and responsive.

Customer form fields:

- Customer name
- Email
- Order ID
- Complaint subject
- Complaint text
- optional complaint category
- optional location/branch

The most important field is complaint text.

Add good validation.

After submission:

Show a professional success state:

"Your complaint has been submitted successfully."

Generate/display a ticket ID.

The complaint should be stored and analyzed automatically.

---

# HIDDEN ADMIN SHORTCUT

The customer portal must NOT show:

Admin Login
Dashboard
Owner Portal

in visible navigation.

Instead listen globally for:

macOS:
Command + A + B

Windows/Linux:
Ctrl + A + B

When detected:

open the admin login modal/page.

Implement this clearly and simply.

Be careful because Command/Ctrl + A normally means Select All.

Prevent unwanted default behavior only when the full admin shortcut sequence is actually being triggered.

If simultaneous detection is unreliable in the browser, implement a short key-sequence listener:

hold Command/Ctrl
press A
then press B within a short time window

Document the behavior clearly.

---

# STEP 10 — ADMIN AUTHENTICATION

Build a simple secure admin authentication system.

Use:

- hashed passwords
- JWT authentication
- protected FastAPI routes

Do NOT store plain-text passwords.

Create a seed/default admin through environment variables or a setup script.

Example environment variables:

ADMIN_EMAIL
ADMIN_PASSWORD

Do not commit actual credentials.

Admin dashboard routes must be protected.

If a user manually types the dashboard URL without a valid token:

redirect them to admin login.

---

# STEP 11 — ADMIN DASHBOARD UI

This is one of the most important parts of the entire project.

The UI should feel like a modern SaaS analytics platform.

Style inspiration:

- Linear
- Vercel
- Stripe Dashboard
- modern B2B analytics products

Avoid:

- excessive gradients
- huge colorful cards
- cartoon UI
- unnecessary animations
- generic student-project dashboard styling

Use:

- white/light neutral background
- black/dark text
- subtle borders
- muted grays
- carefully spaced cards
- professional typography
- simple icons
- smooth hover states

Create a professional left sidebar:

Overview
Tickets
Analytics
Clusters
Similar Cases

and account/logout controls.

---

# OVERVIEW DASHBOARD

Display KPI cards such as:

Total Complaints

Historical Complaints

New Customer Complaints

Open Complaints

Negative Sentiment %

Most Common Complaint Type

Number of Clusters

Average Resolution Time if the dataset supports it

Then add useful visualizations:

Complaint volume over time

Sentiment distribution

Top complaint categories

Complaint category trend

Cluster distribution

Location distribution if useful

Recent complaints table

Recent customer-submitted tickets

Highest-risk / negative complaints

Use Recharts.

Do not fill graphs with fake numbers.

All dashboard values must come from the backend/database.

---

# TICKETS PAGE

Create a professional tickets table.

Columns can include:

Ticket ID

Date

Complaint

Category

Predicted Intent

Sentiment

Cluster

Source

Status

Add:

search

pagination

filters

Filter by:

sentiment

category

cluster

source

status

date if practical

Clicking a row opens ticket details.

---

# TICKET DETAILS PAGE

Display:

Complaint text

Original complaint category

Predicted intent

Intent confidence

Sentiment

Sentiment score

Cluster

Created date

Closed date

Location

Status

Source

Then show:

Top similar historical complaints

Each similar complaint should show:

ticket ID

complaint text

category

similarity %

---

# ANALYTICS PAGE

Provide deeper analytics such as:

Top complaint categories

Sentiment by category

Complaint trends over time

Top recurring issues

Locations with most complaints

Historical vs new complaints

Do not add meaningless charts only to fill space.

Every visualization should answer a useful management question.

---

# CLUSTERS PAGE

Display discovered complaint clusters.

For every cluster show:

Cluster name or ID

Complaint count

Top keywords

Dominant category

Example complaints

Percentage of total complaints

This page should make the K-Means part easy to demonstrate to the manager.

---

# SIMILAR CASES PAGE

Create an interactive tool where admin can paste complaint text.

Button:

Find Similar Cases

Call the backend.

Show top 5 historical complaints with similarity percentage.

Example:

Input:

"My order arrived very late and the food was completely cold."

Results:

Ticket #2041
Delivery / Food quality
91% similar

Ticket #991
Delivery
86% similar

Do not hard-code results.

---

# NEW CUSTOMER COMPLAINT PROCESSING

When a customer submits a complaint:

FastAPI should:

1. validate the request
2. clean the complaint text
3. predict intent
4. predict sentiment
5. assign K-Means cluster
6. store the complaint in database
7. make it available in the dashboard
8. allow similar cases to be retrieved

Do not block complaint creation unnecessarily if one optional ML component fails.

Handle ML errors gracefully.

---

# FASTAPI ENDPOINTS

Create simple routes such as:

POST /api/auth/login

POST /api/complaints

GET /api/complaints

GET /api/complaints/{id}

GET /api/dashboard/summary

GET /api/dashboard/trends

GET /api/analytics/categories

GET /api/analytics/sentiment

GET /api/clusters

POST /api/ml/predict

POST /api/ml/similar

Use REST conventions.

Add FastAPI Swagger documentation automatically.

---

# MODEL LOADING

Do NOT load large models on every request.

Load saved Joblib models once when the FastAPI application starts.

Create simple service functions that reuse them.

---

# FRONTEND API LAYER

Do not call fetch randomly from every component.

Create a simple service file such as:

```javascript
api.js
```

with understandable functions:

```javascript
loginAdmin()
submitComplaint()
getDashboardSummary()
getComplaints()
getComplaintById()
findSimilarComplaints()
getClusters()
```

Keep it simple.

---

# LOADING AND ERROR STATES

Every major page should have:

loading state

empty state

error state

Do not let the UI crash when no data exists.

---

# RESPONSIVENESS

The customer complaint portal must work properly on mobile.

Admin dashboard should work well on:

desktop

laptop

tablet

Mobile admin support is nice but desktop quality is more important.

---

# README

Create a very good README.

Explain:

1. Project idea
2. Architecture
3. Technology stack
4. Folder structure
5. Dataset
6. ML algorithms
7. How intent classification works
8. How sentiment works
9. How cosine similarity works
10. How K-Means works
11. Customer complaint flow
12. Admin dashboard flow
13. How to run backend
14. How to run frontend
15. How to train models
16. How to import historical data
17. How to create admin
18. Environment variables
19. Docker setup
20. Deployment architecture

Write explanations in simple language.

---

# ENVIRONMENT VARIABLES

Create:

.env.example

Include placeholders for:

DATABASE_URL

SECRET_KEY

ADMIN_EMAIL

ADMIN_PASSWORD

FRONTEND_URL

Any other required environment variable.

Never commit secrets.

---

# DOCKER

Add Docker support.

Prefer:

frontend

backend

postgres

through docker-compose for local development if practical.

Do not make Docker configuration unnecessarily complicated.

---

# TESTING

At minimum test:

admin login

customer complaint submission

dashboard summary API

intent prediction

similar complaint retrieval

protected routes

Do not create a huge testing framework.

Simple meaningful tests are enough.

---

# FINAL QUALITY CHECK

Before claiming completion:

1. Run backend.
2. Fix Python errors.
3. Run frontend.
4. Fix React errors.
5. Check browser console.
6. Check FastAPI logs.
7. Train/load models.
8. Import historical dataset.
9. Submit one complaint through customer portal.
10. Verify that it appears in admin dashboard.
11. Verify intent prediction.
12. Verify sentiment.
13. Verify cluster assignment.
14. Verify similar cases.
15. Verify charts use real backend data.
16. Verify admin routes are protected.
17. Verify hidden shortcut works.
18. Verify refresh does not break React routing.
19. Verify no secrets are committed.
20. Verify README commands are correct.

Do not leave placeholder buttons that do nothing.

Do not use fake dashboard data after real data is available.

---

# IMPORTANT DEVELOPMENT APPROACH

Work incrementally.

Do not generate hundreds of files without testing.

Proceed in this order:

PHASE 1
Inspect dataset.

PHASE 2
Build preprocessing.

PHASE 3
Build and evaluate ML pipeline.

PHASE 4
Save trained models.

PHASE 5
Create database.

PHASE 6
Build FastAPI endpoints.

PHASE 7
Import historical complaints.

PHASE 8
Build customer complaint portal.

PHASE 9
Build admin authentication.

PHASE 10
Build dashboard.

PHASE 11
Connect all dashboard charts to real data.

PHASE 12
Build tickets/details/clusters/similarity pages.

PHASE 13
Docker and final cleanup.

PHASE 14
End-to-end testing.

After every major phase, run the project and fix errors before continuing.

---

# MOST IMPORTANT PRODUCT DEMO

The completed project must support this demonstration:

1. Open SupportIQ.
2. Customer sees UrbanBite complaint portal.
3. Submit:

"My order arrived almost one hour late and the food was completely cold."

4. Receive ticket confirmation.
5. Trigger hidden admin shortcut:

Command + A + B

6. Login as admin.
7. Dashboard shows the newly submitted complaint.
8. Open the complaint.
9. Show:

Predicted intent

Sentiment

Cluster

Historical similar cases

10. Open dashboard analytics.
11. Show insights generated from the historical NYC complaint dataset.
12. Open clusters.
13. Explain how K-Means discovered recurring patterns.

This workflow must work end-to-end.

---

# FINAL RULE

Build a polished product, but keep the implementation understandable.

This is an internship Star Project, not an enterprise banking platform.

Prioritize:

working functionality

clean UI

real dataset usage

Classical ML concepts

clear code

good comments

easy explanation

proper integration

over unnecessary complexity.

Start by inspecting the existing project and the dataset.

Do not ask me for the dataset path before searching the project directory yourself.

Then implement the project phase by phase and continuously test it.