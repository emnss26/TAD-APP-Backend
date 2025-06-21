# TAD-APP-Backend

TAD-APP-Backend is the API server that powers the [TAD](https://tad-app.example.com) application. It exposes endpoints to interact with Autodesk Platform Services (APS), store data in MongoDB/Oracle, and provide AI assisted responses using Google's Generative AI.

## Project purpose

This project centralises all server side functionality used by the TAD front‑end:

* OAuth authentication with Autodesk and retrieval of construction data
* Storage of plans, models and tasks in MongoDB and Oracle via ORDS
* AI helpers that summarise project information using Gemini
* Miscellaneous endpoints for project management features

## Required environment variables

Create a `.env` file with the following variables:

```
PORT=3000                      # Port to run the server
FRONTEND_URL=http://localhost:5173

APS_CLIENT_ID=<your Autodesk client id>
APS_CLIENT_SECRET=<your Autodesk client secret>
REDIRECT_URI=http://localhost:3000/auth/three-legged

ORDS_URL=<Oracle ORDS base url>
ADMIN_PASSWORD=<ORDS admin password>
ORDS_SCHEMA=admin              # optional

MONGODB_DATABASE_URL=mongodb://localhost:27017/tad

GOOGLE_API_KEY=<Google generative AI API key>
AUTODESK_BASE_URL=https://developer.api.autodesk.com
NODE_ENV=development           # production or development
```

The variables are used as follows:

| Variable | Purpose |
|----------|---------|
| `PORT` | Port where the server listens |
| `FRONTEND_URL` | Allowed origin for CORS and cookies |
| `APS_CLIENT_ID` / `APS_CLIENT_SECRET` | Autodesk OAuth credentials |
| `REDIRECT_URI` | Callback URL configured in your APS app |
| `ORDS_URL` | Base URL of Oracle ORDS service |
| `ADMIN_PASSWORD` | Password for the ORDS admin account |
| `ORDS_SCHEMA` | ORDS schema name (usually `admin`) |
| `MONGODB_DATABASE_URL` | Connection string for MongoDB |
| `GOOGLE_API_KEY` | API key for Google Generative AI |
| `AUTODESK_BASE_URL` | Autodesk API base URL |
| `NODE_ENV` | `development` or `production` mode |

## Obtaining Autodesk credentials

1. Sign in at [Autodesk Developer Portal](https://aps.autodesk.com/).
2. Create a new **APS App** and set the callback URL to your `REDIRECT_URI`.
3. Copy the generated **client id** and **client secret** and place them in
   `APS_CLIENT_ID` and `APS_CLIENT_SECRET`.

## Obtaining Google API credentials

1. Visit [makersuite.google.com](https://makersuite.google.com/app/apikey) or the
   Google Cloud console and create an API key for the Generative AI service.
2. Enable the Generative AI API if required and copy the key value.
3. Set the value in the `GOOGLE_API_KEY` variable.

## Installation and running the server

Install dependencies and start the server:

```bash
npm install
npm run dev     # start with nodemon
# or
npm start       # start without reloading
```

The server will listen on `PORT` (default 3000).

### Running with Docker

This project does not include a Dockerfile, but you can run it in a container
using the official Node image:

```bash
docker run --env-file .env -p 3000:3000 \
  -v $(pwd):/app -w /app node:18 \
  sh -c "npm install && npm start"
```

Adjust the image version and port mapping as needed.

## Main API endpoints

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/csrf-token` | `GET` | Obtain a CSRF token for forms |
| `/auth/three-legged` | `GET` | Autodesk OAuth login |
| `/auth/token` | `GET` | Retrieve a two‑legged APS token |
| `/auth/logout` | `POST` | Log out and clear cookie |
| `/auth/status` | `GET` | Check if the Autodesk token is valid |
| `/general/userprofile` | `GET` | Returns the logged user profile |
| `/acc/accprojects` | `GET` | List ACC projects for the account |
| `/acc/accprojects/:accountId/:projectId/users` | `GET` | Fetch ACC project users |
| `/bim360/bim360projects` | `GET` | List BIM360 projects |
| `/datamanagement/items/:accountId/:projectId/federatedmodel` | `GET` | Retrieve federated model info |
| `/modeldata/:accountId/:projectId/data` | `POST`/`GET` | Save or read model database entries |
| `/plans/:accountId/:projectId/plans` | CRUD | Manage plan documents |
| `/task/:accountId/:projectId/tasks` | CRUD | Manage project tasks |
| `/ai-users/users` | `POST` | Ask Gemini questions about stored users |
| `/ai-issues/issues` | `POST` | Ask Gemini questions about issues |
| `/ai-submittlas/submittals` | `POST` | Ask Gemini questions about submittals |
| `/ai-rfis/rfis` | `POST` | Ask Gemini questions about RFIs |
| `/ai-modeldata/model-da` | `POST` | Ask Gemini questions about model data |

Most `/acc`, `/bim360` and `/datamanagement` routes require a valid Autodesk
access token stored in the `access_token` cookie obtained via the login route.

### Security features

* **Authentication** – Autodesk OAuth tokens are used to protect most routes.
* **Rate limiting** – different limits apply to authentication, read and write
  operations to avoid abuse.
* **CSRF protection** – the API issues a token from `/csrf-token` and validates
  it for non-AI routes.

### Running the tests

The repository does not yet contain automated tests, but the script is wired so
you can run:

```bash
npm test
```

and add your own test suites in the future.

### Folder structure

```
├─ app.js              # Express application entry point
├─ config/             # Database and environment helpers
├─ const/              # Static configuration values
├─ libs/               # Reusable libraries and APS helpers
├─ openai/             # Google Generative AI integrations
├─ resources/          # Express routers and controllers
├─ utils/              # Utility functions
└─ vercel.json         # Vercel deployment configuration
```

