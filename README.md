# Foothold

Foothold is a job application tracker for recording applications, keeping company and role details together, and following each application through its status.

## Links

- **Website:** [https://waltermakhado.github.io/foothold-app/](https://waltermakhado.github.io/foothold-app/)
- **Source code:** [https://github.com/Waltermakhado/foothold-app](https://github.com/Waltermakhado/foothold-app)

The website is a static GitHub Pages preview. The landing page is available there, but login, registration, and application data need the API described below; that API is not hosted on GitHub Pages yet.

## Database and API

During local development, the app uses **JSON Server** as a lightweight REST API and `db.json` as its file-based data store. It provides `/users` and `/jobs` endpoints at `http://localhost:3001`.

The real `db.json` is intentionally excluded from Git because it can contain account credentials and personal application records. To create a clean local database, copy the empty template and start both the frontend and API:

```sh
Copy-Item db.example.json db.json
npm install
npm run dev:full
```

On macOS or Linux, use `cp db.example.json db.json` instead of `Copy-Item`. Then open the local URL printed by Vite. Keep personal data in your local `db.json`; do not commit it.

JSON Server and a local JSON file are suitable for development and demonstration, not for production accounts or a publicly hosted service. A production deployment needs a separately hosted API and persistent database.

## Development

Requirements: Node.js and npm.

```sh
npm install
npm run build
```

The GitHub Pages site is rebuilt and deployed automatically when changes are pushed to the `main` branch.
