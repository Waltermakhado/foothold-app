import pg from "pg"

import { createApp } from "./app.js"

import { initializeSchema } from "./schema.js"

const { Pool } = pg

const port = Number.parseInt(process.env.PORT || "3001", 10)

const databaseUrl = process.env.DATABASE_URL

const jwtSecret = process.env.JWT_SECRET

if (!databaseUrl) throw new Error("DATABASE_URL is required.")

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.")
}

if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_ORIGIN) {
  throw new Error("FRONTEND_ORIGIN is required in production.")
}

const pool = new Pool({
  connectionString: databaseUrl,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,

  max: 10,

  connectionTimeoutMillis: 10000,

  idleTimeoutMillis: 30000,
})

pool.on("error", () => {
  console.error("Unexpected PostgreSQL pool error.")
})

try {
  await initializeSchema(pool)

  const app = createApp({
    pool,

    jwtSecret,

    frontendOrigin: process.env.FRONTEND_ORIGIN,

    nodeEnv: process.env.NODE_ENV,
  })

  app.listen(port, "0.0.0.0", () => {
    console.log(`Foothold API listening on port ${port}.`)
  })
} catch (error) {
  await pool.end()

  console.error("API startup failed:", error.message)

  process.exitCode = 1
}
