# Joblets

A full-stack web app that simulates email-powered job application tracking. Users can sign up, connect their email, refresh their inbox, classify job-related emails with a mock AI layer, extract structured application data, prevent duplicates, and manage everything from a responsive dashboard.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Storage: Simple file-backed JSON store
- AI: Mock email classifier and extractor with structured portal and email links

## Features

- Simple signup/login flow
- Simulated email inbox connection
- Refresh Inbox action with batched sample emails
- AI email classification:
  - Application Confirmation
  - Rejection
  - Interview Invitation
  - Offer
  - Not Relevant
- Structured data extraction for company, role, date, status, portal links, and email links
- Duplicate prevention and status updates for repeat application threads
- Dashboard with:
  - Insights cards
  - Filter by status and date range
  - Sort by date, company, or status
  - Inline manual editing
  - Portal access links
  - Clickable role links back to the original email
  - Highlighting for new entries
- Responsive startup-style UI

## Folder Structure

```text
.
|-- client
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   `-- src
|       |-- App.jsx
|       |-- api.js
|       |-- main.jsx
|       `-- styles.css
|-- server
|   |-- data
|   |   `-- store.json
|   |-- package.json
|   `-- src
|       |-- index.js
|       |-- services
|       |   |-- emailAnalyzer.js
|       |   `-- mockEmails.js
|       `-- storage
|           `-- store.js
|-- package.json
`-- README.md
```

## Local Setup

1. Install Node.js 20 or newer.
2. From the project root, install dependencies:

```bash
npm install
```

3. Start both the backend and frontend:

```bash
npm run dev
```

4. Open the frontend at:

- [http://localhost:5173](http://localhost:5173)

The Express API runs on:

- [http://localhost:4000](http://localhost:4000)

## Demo Flow

1. Create an account or log in.
2. Click `Connect Email` to simulate inbox connection.
3. Click `Refresh Inbox`.
4. Watch the dashboard populate with extracted applications.
5. Click a role to open the original email or use `View Application` when a portal link is available.
6. Refresh again to load the next sample email batch and see status updates and new records.

## Notes

- This project intentionally uses a lightweight mock AI function instead of requiring an external API key.
- Storage is file-backed for demo convenience and resets cleanly by editing `server/data/store.json`.
- Passwords are stored plainly because the app is intentionally non-production and built for demonstration.
