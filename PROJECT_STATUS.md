# SupportIQ — One-Page Project Status

**Status:** Final local verification passed on October 1, 2026. Source is published privately at https://github.com/umer-tahir1/supportiq, and the frontend is deployed at https://supportiq-lime.vercel.app. Backend/database hosting remains pending account configuration; the hosted interface is not yet a functional full-stack deployment.

## Completed

- **Dataset inspection and cleaning:** Inspected all 38 source columns and 75,258 records. Preserved original descriptors, parsed dates, checked missing values and duplicates, and saved the cleaned dataset. No historical complaints were fabricated.
- **ML/NLP pipeline:** Trained and saved TF-IDF + Logistic Regression intent classification, VADER sentiment with documented restaurant phrase rules, cosine-similarity retrieval, and K-Means clustering. Evaluated K = 5, 8, and 10; selected 10 clusters. Models load once at API startup.
- **Database and backend:** Implemented FastAPI, validation, SQLAlchemy tables, explicit duplicate-safe historical imports, complaint analysis, ticket status updates, analytics endpoints, and Swagger documentation. All 75,258 historical records were imported into both local SQLite and Docker PostgreSQL. Repeated imports added zero duplicates.
- **Admin security:** Implemented Argon2 password hashing, expiring JWTs, protected API routes, login throttling, logout, and the hidden Command/Ctrl + A then B shortcut. Local credentials are stored in the ignored `.env` file.
- **Frontend:** Built the responsive UrbanBite complaint portal, ticket confirmation, admin login, Overview, Tickets, Ticket Details, Analytics, Clusters, and Similar Cases. Charts and tables use backend/database data. Search, filters, pagination, loading/error/empty states, and status changes are implemented.
- **Delivery materials:** Added Docker Compose, frontend/backend Dockerfiles, Vercel routing configuration, environment examples, a detailed README, dataset/model notes, and a manager presentation guide.

## Verified

- **6 backend integration tests passed**, covering authentication, route protection, validation, submission, analysis, dashboard totals, filtering, status changes, similarity, and optional-model failure.
- Frontend production builds and both Docker image builds passed.
- PostgreSQL import, admin creation, duplicate-safe repeat import, and API model readiness passed.
- **3 browser scenarios passed against Docker/PostgreSQL:** the complete customer-to-admin demo; protected navigation, both shortcut modifiers and normal Select All; mobile portal layout.
- The demo complaint produced Food Temperature intent, negative sentiment, a cluster assignment, and five real historical matches. The full-demo browser check reported no JavaScript errors.
- A source/documentation scan found no generated local credentials.

## Remaining

1. Configure a hosted Python backend and PostgreSQL database, provision trusted model artifacts, import historical records, and seed the administrator.
2. Set the production `VITE_API_URL`, redeploy the frontend, and verify the deployed API and browser-to-API connection. The current homepage and admin login route both return HTTP 200.

## Final local verification — October 1, 2026

- All 6 backend integration tests passed; only third-party deprecation warnings remain.
- The frontend production build passed.
- All 4 browser scenarios passed against the local SQLite-backed API, including submission, login, analysis, status persistence, charts, filters, nested-route refresh, keyboard shortcuts, mobile layout, tablet layout, and empty/error/retry states.
- The tablet dashboard reports 820px content width at an 820px viewport; the previously recorded overflow did not reproduce. Temporary layout diagnostics were removed.
- The production npm dependency audit reported zero known vulnerabilities.
- Vercel successfully built and deployed the frontend to https://supportiq-lime.vercel.app. A hosted backend and production `VITE_API_URL` are still required for submissions and admin features. The latest run did not rebuild Docker images or repeat PostgreSQL checks.

## Current Local Access and Model Limitations

**Application:** http://localhost:5173 · **Docker API docs:** http://localhost:8001/docs. Port 8001 avoids a Docker reservation conflict on port 8000. Admin credentials are in the root `.env` file.

The dataset contains 32 repeated problem descriptors, with no customer narratives or sentiment labels. The classifier’s 100% descriptor-reconstruction score does not establish accuracy on unseen customer language. Sentiment and clusters are derived analysis; delivery delays have no historical target category. These limitations are documented in the application and README.
