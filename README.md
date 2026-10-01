# SupportIQ — customer support intelligence

An internship MVP for **UrbanBite Foods**: a public complaint portal and a private analytics workspace. Customers send feedback, receive a ticket reference, and administrators review it alongside **75,258 real NYC food-establishment complaints**.

The application uses classical machine learning, straightforward Python functions, and React components. It has no paid AI API, embeddings, or deep-learning dependency.

## Run the project locally

Requirements: **Python 3.14**, **Node.js 24**, and npm. The checked-in Python lock file reflects the environment used for this project. Run all commands from the project root unless a command explicitly changes directory.

### 1. Backend setup

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements-lock.txt
cd backend
.venv/bin/python -m scripts.setup_local
.venv/bin/python -m ml.inspect_dataset
.venv/bin/python -m ml.train_all
.venv/bin/python -m scripts.import_historical
.venv/bin/python -m scripts.create_admin
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

`setup_local` generates a private root `.env` with random credentials and SQLite configuration. Open **`.env` locally** to read `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Existing settings and passwords are not overwritten; an absent Docker PostgreSQL password may be added. Do not publish this file. On Windows, use `backend\.venv\Scripts\python.exe` and `backend\.venv\Scripts\uvicorn.exe` in place of the corresponding `bin` commands.

The Swagger API explorer is at **http://localhost:8000/docs**. Health information is at **http://localhost:8000/api/health**. Missing model files do not prevent complaint submission; missing/placeholder `SECRET_KEY` intentionally prevents API startup.

### 2. Frontend setup (another terminal)

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Use `localhost`, not the numeric IP, to match the configured CORS origin.

### 3. Admin access

On the customer portal, hold **Command on macOS** or **Ctrl on Windows/Linux**, press **A**, then press **B within 1.2 seconds**, while still holding the modifier. The login page opens. Normal Command/Ctrl+A remains Select All; only the completed shortcut prevents the B key’s default action.

Sign in with the credentials in `.env`. The shortcut is a discovery feature, not security. Every private API checks a signed JWT and the administrator’s database role. Manually opening `/admin` without authentication redirects to login. An expired token signs the administrator out. Tokens expire after eight hours and are stored in tab-scoped session storage.

## Demo walkthrough

1. Open the public portal and enter a name, email, and subject.
2. Submit: `My order arrived almost one hour late and the food was completely cold.`
3. Save the `UB-...` confirmation reference.
4. Use the hidden shortcut and sign in.
5. Find the complaint in Overview → Fresh from your customers. Overview refreshes every 15 seconds; the Refresh data button updates it immediately.
6. Open the ticket. See the original text, predicted Food Temperature intent, derived negative sentiment, a nearest cluster, and five actual historical matches.
7. Change the status to In Progress or Closed. Closing stores a closed timestamp; reopening clears it.
8. Show Analytics, Clusters, and Similar Cases.

The historical dataset has **no delivery-delay category**. Food Temperature reflects the cold-food part of the example. Never claim that this model learned delivery-delay handling. Low-confidence wording returns `Needs review`.

## Architecture and folder guide

```text
Source CSV → preprocess → TF-IDF / Logistic Regression / K-Means
                               ↓ saved Joblib artifacts
                    explicit import → PostgreSQL (or local SQLite)
                                             ↑
Customer portal → FastAPI → analysis functions + save complaint
                                             ↓
                 authenticated React dashboard → database-backed charts
```

```text
backend/
  app/
    main.py                 API startup, CORS, and route registration
    database.py             SQLAlchemy engine and request sessions
    models.py               users and complaints tables
    schemas.py              input validation
    auth.py                 password hashing and JWT verification
    routes/                 auth, complaints, dashboard, ML endpoints
    services/               complaint creation, metrics, reusable analysis
  ml/
    inspect_dataset.py      print actual source schema and data quality
    preprocess.py           standardize and preserve source text
    train_intent.py          descriptor classifier and evaluation
    train_sentiment.py       save and document VADER settings
    train_clusters.py        K-Means experiment and cluster keywords
    domain_rules.py          explicit restaurant phrase rules
    similarity.py            save the historical TF-IDF index
    train_all.py             run training and save evaluation
  scripts/                  local configuration, admin creation, import
  tests/                    isolated API integration tests
  data/processed/           generated cleaned CSV and cleaning report
  saved_models/             generated models, index, and evaluation JSON
frontend/
  src/components/           common controls, tables, charts
  src/hooks/                data loading and hidden keyboard shortcut
  src/layouts/              protected admin workspace
  src/pages/                portal, login, overview, tickets, analytics, etc.
  src/services/api.js       all HTTP requests and token handling
  tests/                    browser demo, routing, shortcut, mobile checks
docker-compose.yml          PostgreSQL, FastAPI, and frontend containers
docs/                       dataset notes and manager walkthrough
```

## Dataset: what actually exists

The supplied file is `311_Restaurant_data_20260930.csv`: **75,258 rows, 38 columns**, spanning **January 1, 2020 through September 29, 2026** by created date. The raw CSV remains untouched.

| Source column | Internal use |
| --- | --- |
| `Unique Key` | `external_ticket_id` (unique, prevents duplicate imports) |
| `Problem (formerly Complaint Type)` | Original `complaint_type`; every source row is Food Establishment |
| `Problem Detail (formerly Descriptor)` | Original `complaint_text` and the 32 intent training labels |
| `Created Date`, `Closed Date` | `created_at`, `closed_at` |
| `Incident Address`, `Borough`, `Incident Zip` | `location`; borough also stored separately |
| `Status` | Source status; Unspecified becomes Unknown |

There are **no free-form narratives, sentiment labels, restaurant names, customer names/emails, or order IDs** in the historical export. Those customer fields exist only for new portal submissions. The UI uses UrbanBite branding as a demo company, not as an assertion that these public records belong to a real UrbanBite business.

Preprocessing lowercases a separate copy of the descriptor, removes punctuation and repeated whitespace, parses the inspected date format, removes duplicate ticket IDs, and excludes empty descriptors. The supplied file has no duplicate IDs, empty descriptors, or invalid created dates. It has 2,621 missing closed dates. Raw and cleaned text are both retained. No thousands of invented complaints are created.

Historical timestamps are retained as NYC source wall times; portal timestamps are stored as UTC without an offset. Charts use their recorded calendar dates, not a unified time-zone conversion. For this MVP, date display uses calendar dates. Cross-source hourly comparisons would need a timezone migration. Resolution averages exclude missing or negative date pairs and reflect source history, **not an UrbanBite service SLA**; the dataset contains long closure intervals.

See [dataset and evaluation notes](docs/DATASET_AND_MODELS.md) for counts and limitations.

## How the analysis works

### Intent — TF-IDF and Logistic Regression

TF-IDF converts words and two-word phrases into numeric weights. Logistic Regression learns which weights correspond to each of the 32 descriptors. The training script uses a stratified 80/20 split, prints/saves accuracy and a classification report containing precision, recall, and F1, and saves a confusion matrix. All classes have at least 16 rows, so none are removed for this export; the general script excludes classes below five samples.

**Evaluation limitation:** text and target are the same source descriptor, repeated across thousands of rows. The 100% held-out descriptor reconstruction score is expected and is **not evidence of generalization to new customer narratives**. A meaningful independent evaluation needs separately labeled real customer text. Model probabilities are not calibrated confidence guarantees. Scores below 0.35 produce `Needs review`; text with no shared vocabulary does too.

`ml/domain_rules.py` adds a few explicit vocabulary expansions at inference time: cold/undercooked food → food temperature, rotten/moldy → food spoiled, and rats/bugs → rodents/insects. These are manually authored rules, not extra training records. The original text remains intact. Expansions are also used for similarity and nearest-cluster assignment.

### Sentiment — VADER with transparent domain rules

VADER uses a lexicon and language rules. Its compound polarity ranges from −1 to +1. At least 0.05 is Positive; at most −0.05 is Negative; otherwise Neutral. Two explicit restaurant tokens handle late orders and cold food, which base VADER misses. No sentiment classifier is trained and no source sentiment labels are claimed. The saved sentiment artifact records settings rather than pretending to be a trained classifier.

Neutral administrative wording can describe a serious safety issue. Sentiment must not be interpreted as urgency, risk, or customer satisfaction. Simple phrase rules can also miss negation or context.

### Similarity — TF-IDF and cosine similarity

The complaint is converted with the historical vectorizer, then its vector is compared with historical vectors. We return up to five positive-score matches, their real ticket IDs, descriptors, and percentages. A cosine score measures shared vocabulary, not the probability of the same incident. The source has repeated descriptors, so ties and identical text across different ticket IDs are normal. Zero-overlap matches are omitted, and a historical ticket’s detail page excludes itself.

### Clusters — K-Means

K-Means groups similar TF-IDF vectors. We test K = 5, 8, and 10 and choose the best silhouette score on the **32 unique descriptors**, avoiding artificially strong evaluation from duplicated text. K = 10 was selected, with a modest score of approximately 0.023. This is a weak, vocabulary-driven grouping and may mix issues. Cluster display names come from the highest-weight terms; dominant training descriptors and example descriptors are shown separately. New complaints use the nearest center, or remain unassigned if they have no vocabulary overlap.

### Analysis availability

Joblib models load once at API startup. `predict_intent`, `predict_sentiment`, and `assign_cluster` run independently. If an optional component fails, the complaint is still saved with an analysis warning. Similarity returns a clear unavailable state if the index is missing. Restart the API after retraining. Only load your own trusted Joblib files.

## Database and API

PostgreSQL is the intended deployment database. SQLite is configured by the local helper so the project can run without a separate database server. SQLAlchemy uses the same tables and queries for both. Models are created at startup for this MVP; schema changes to an existing deployed database need a migration plan.

`users` stores an email, Argon2 password hash, role, and creation date. `complaints` stores source text and type separately from intent, sentiment, cluster, customer fields, status, timestamps, and analysis warnings. Every complaint has `source = historical_dataset` or `customer_portal`.

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | Public; ten attempts per IP per minute per process |
| GET | `/api/auth/me` | Admin |
| POST | `/api/complaints` | Public; validated submission, ticket reference only |
| GET | `/api/complaints` | Admin; search, pagination, filters, date range |
| GET / PATCH | `/api/complaints/{ticket_id}` | Admin; details / status |
| GET | `/api/dashboard/summary` | Admin; totals and recent tickets |
| GET | `/api/dashboard/trends` | Admin; monthly volume by source and derived issue |
| GET | `/api/analytics/categories` | Admin; original categories, derived issues, boroughs, sources |
| GET | `/api/analytics/sentiment` | Admin; overall and issue-group sentiment |
| GET | `/api/clusters` | Admin; counts, keywords, examples, K experiments |
| POST | `/api/ml/predict` | Admin; reusable analysis |
| POST | `/api/ml/similar` | Admin; historical matching |
| GET | `/api/ml/evaluation` | Admin; saved training evaluation |
| GET | `/api/health` | Public; readiness of analysis artifacts |

Swagger’s Authorize button accepts the bearer token returned by login. No customer information is exposed through unauthenticated GET routes. The in-memory login throttle is deliberately simple; a multi-worker internet deployment should use a shared gateway limiter, including protection for public submissions.

The chart data is read from the database. Overview includes total/historical/live/open counts, negative sentiment proportion among analyzed records, cluster count, average closure time, monthly volume, recurring issues, sentiment, recent submissions, and negative feedback for review. Tickets supports source, original category, sentiment, status, cluster, dates, search, and pagination. Clusters uses trained metadata with current database counts.

## Training, importing, and administration

From `backend/`:

```bash
.venv/bin/python -m ml.inspect_dataset
.venv/bin/python -m ml.preprocess
.venv/bin/python -m ml.train_all
.venv/bin/python -m scripts.import_historical
.venv/bin/python -m scripts.create_admin
.venv/bin/python -m pytest -q
```

The scripts discover the root CSV automatically. If there are multiple CSV files, pass `--dataset /absolute/path/to/source.csv` to inspection/preprocessing/training. The pipeline expects the inspected schema of this export; a different dataset needs deliberate column mapping. `train_all` includes preprocessing, so the standalone preprocessing command is optional.

Importing is explicit and idempotent: existing external IDs are skipped, even after a partially completed import. Startup never imports the CSV. Re-import does **not** overwrite existing statuses or reanalyze existing rows. Retraining with changed labels/cluster definitions requires deliberately rebuilding or reanalyzing stored results; cluster IDs from different model versions are not interchangeable.

Admin creation reads environment variables and does not overwrite an existing administrator’s password. To add another admin, set a different valid `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running the command. There is no public registration or password-reset endpoint.

## Environment variables

`.env.example` contains placeholders only. The root `.env` is ignored by version control and excluded from Docker builds.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://user:password@host:5432/supportiq` or local `sqlite:///...` |
| `SECRET_KEY` | At least 32 random characters for signing JWTs |
| `ADMIN_EMAIL` | Administrator seeded by the explicit setup command |
| `ADMIN_PASSWORD` | At least 12 characters; stored only as an Argon2 hash in the DB |
| `FRONTEND_URL` | Exact permitted browser origin, e.g. `http://localhost:5173` |
| `VITE_API_URL` | Browser-visible API base, including `/api`; resolved at frontend build time |
| `POSTGRES_PASSWORD` | Docker database password; use URL-safe random hex |
| `API_PORT` | Docker API host port, default 8000; this prepared workspace uses 8001 because 8000 was reserved |
| `DATASET_FILE` | Optional Compose source filename; defaults to the supplied export |

Never put backend secrets in `VITE_` variables; those become public browser code. Do not commit generated `.env`, local databases, or browser artifacts containing customer details.

## Docker + PostgreSQL

Install/start Docker Desktop. Generate `.env` with the helper above, or copy `.env.example` and replace every placeholder. Stop local processes using ports 8000 and 5173 before starting the complete stack.

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm backend python -m ml.train_all --dataset /dataset.csv
docker compose run --rm backend python -m scripts.import_historical
docker compose run --rm backend python -m scripts.create_admin
docker compose up -d
```

Open http://localhost:5173. Compose deliberately overrides the local SQLite URL with its PostgreSQL URL. PostgreSQL is only exposed to other containers, and its data persists in a named volume. Models and processed files are mounted from `backend/`; the supplied CSV is mounted read-only. Nginx serves the frontend and falls back to `index.html` so refreshing `/admin/tickets/...` works. `docker compose down` stops containers while retaining the database volume.

If Docker reports that port 8000 is allocated, set `API_PORT=8001` in `.env`, rebuild the frontend, and run `docker compose up -d` again. Compose builds the matching browser API URL automatically. The prepared workspace uses **http://localhost:8001/docs** for Docker Swagger. Local Python development still defaults to port 8000 and uses `VITE_API_URL` from `.env`.

The backend image excludes the raw CSV, local database, secrets, and model artifacts; artifacts are supplied by the documented mounts. Changing a database password in `.env` does not automatically change the password inside an already-initialized PostgreSQL volume.

## Deployment

- **Frontend / Vercel:** set the project root to `frontend`, install with `npm ci`, build with `npm run build`, output `dist`. Set `VITE_API_URL=https://YOUR_API_HOST/api` before building. `vercel.json` handles client-side route refresh.
- **Backend / Render or Railway:** use Python 3.14 and the locked requirements, root `backend`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set the PostgreSQL URL, random signing key, admin variables, and the exact HTTPS frontend origin.
- **Models/data:** upload the generated trusted `saved_models` directory to persistent storage or train during a controlled setup job with the real CSV. The API does not download the data. Run historical import and admin creation once against the hosted database. Do not expose the CSV or processed customer data in the frontend build.
- **Database:** use a managed PostgreSQL instance and provider-required TLS settings. Add `?sslmode=require` to the URL when required by the provider.

Use HTTPS for the browser and API. For a public service beyond this internship MVP, add shared request throttling, operational monitoring, backups, schema migrations, data retention controls, and a model version/reanalysis workflow. No external deployment is performed by this project setup.

## Tests and quality checks

Backend tests use an isolated temporary SQLite database and the real trained artifacts. They cover login, invalid tokens, protected routes, validation, submission, analysis, dashboard totals, filtering, status changes, similarity, and optional-model failure.

With the backend and frontend running, from `frontend/`:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests read local credentials from the root `.env`, submit one clearly named demo complaint to the running database, use both keyboard modifiers, check normal Select All, log in, inspect analysis, change status, visit charts/filters/clusters/similarity, refresh a nested route, test logout, check console errors, and capture desktop/mobile screenshots in ignored `artifacts/`. Each full demo run intentionally adds one real portal test submission. Do not run the browser suite against a production database.

The frontend has loading, error, and empty states; the portal supports mobile widths, and the admin sidebar collapses on small screens. There are no hard-coded chart values or nonfunctional action buttons.

For a file-by-file explanation you can use with your manager, see [the presentation guide](docs/MANAGER_WALKTHROUGH.md).
