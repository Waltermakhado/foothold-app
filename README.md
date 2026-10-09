# Foothold

Foothold is a job application tracker for recording applications, keeping company and role details together, and following each application through its status.

## Links

- **Website:** [https://waltermakhado.github.io/foothold-app/](https://waltermakhado.github.io/foothold-app/)
- **Source code:** [https://github.com/Waltermakhado/foothold-app](https://github.com/Waltermakhado/foothold-app)

The frontend is hosted on GitHub Pages. The repository includes a Render Blueprint for a secure API and PostgreSQL database. Sign-in and application data will work on the public website once the Render service is created and its URL is added to the GitHub Actions variable described below.

## Database and API

The API stores accounts and applications in PostgreSQL. Passwords are hashed by the API, and each request for application data is scoped to the signed-in account. The frontend receives short-lived signed access tokens; it never reads the user table or password hashes. Existing records in a local `db.json` are not automatically migrated; create a new account on the hosted service.

### Deploy the API

1. In Render, choose **New + → Blueprint** and connect this repository. Render reads `render.yaml` to create the API service and PostgreSQL database.
2. Wait for the `foothold-api` service to finish deploying. Its health endpoint is `/health`.
3. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add `VITE_API_URL` with the service's public URL, without a trailing slash (for example, `https://foothold-api.onrender.com`).
4. Run the **Deploy website** workflow from **Actions**, or push a change to `main`. The Pages build will include the API URL.

The frontend API URL is a public endpoint, not a secret. Do not put database credentials, signing secrets, or passwords in GitHub Pages variables or source code. Render generates the API signing secret and keeps the database connection private. Check Render's current free-plan limits and database retention before relying on it for long-term data storage.

### Run locally

For local API development, set `DATABASE_URL` and `JWT_SECRET` in an untracked `.env` file using a local PostgreSQL instance, then run:

```sh
npm install
npm run start:api
```

In a second terminal, start the Vite frontend:

```sh
npm run dev
```

The API defaults to `http://localhost:3001`. The GitHub Pages build gets its API URL from the `VITE_API_URL` Actions variable; local Vite development uses `http://localhost:3001` by default.

The old local `db.json` is excluded from Git and is not used by the hosted service. Its existing accounts and applications remain local; register a fresh account on the hosted service.

## Build

```sh
npm run build
```

The GitHub Pages site is rebuilt and deployed automatically when changes are pushed to `main`.
