import bcrypt from "bcryptjs"

import cors from "cors"

import express from "express"

import { rateLimit } from "express-rate-limit"

import helmet from "helmet"

import jwt from "jsonwebtoken"

const PASSWORD_ROUNDS = 12

const TOKEN_LIFETIME = "7d"

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/

const JOB_FIELDS = {
  company: { column: "company", maxLength: 200 },

  role: { column: "role", maxLength: 200 },

  status: { column: "status", maxLength: 20 },

  dateApplied: { column: "date_applied", maxLength: 10 },

  duties: { column: "duties", maxLength: 10000 },

  address: { column: "address", maxLength: 1000 },

  contactEmail: { column: "contact_email", maxLength: 320 },

  contactPhone: { column: "contact_phone", maxLength: 100 },

  website: { column: "website", maxLength: 2000 },

  requirements: { column: "requirements", maxLength: 10000 },

  notes: { column: "notes", maxLength: 20000 },
}

const JOB_COLUMNS = `id, user_id AS "userId", company, role, status,
  date_applied::text AS "dateApplied", duties, address,
  contact_email AS "contactEmail", contact_phone AS "contactPhone",
  website, requirements, notes`

const ALLOWED_STATUSES = new Set(["Applied", "Interviewed", "Rejected"])

const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",

  "http://127.0.0.1:5173",
])

function publicUser(user) {
  return { id: user.id, username: user.username }
}

function validUserInput(body) {
  const username =
    typeof body?.username === "string" ? body.username.trim().toLowerCase() : ""

  const password = body?.password

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Username must be 3–32 characters (letters, numbers, dots, dashes, or underscores).",
    }
  }

  if (
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return { error: "Password must be between 8 and 72 bytes." }
  }

  return { username, password }
}

function validateJob(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A job object is required." }
  }

  const fields = {}

  for (const [field, { maxLength }] of Object.entries(JOB_FIELDS)) {
    if (!Object.hasOwn(body, field)) {
      if (!partial) return { error: `Missing required field: ${field}.` }

      continue
    }

    const value = body[field]

    if (typeof value !== "string" || value.length > maxLength) {
      return {
        error: `${field} must be a string no longer than ${maxLength} characters.`,
      }
    }

    fields[field] = value
  }

  const unknown = Object.keys(body).filter(
    (key) => !Object.hasOwn(JOB_FIELDS, key),
  )

  if (unknown.length > 0) {
    return { error: `Unknown job field: ${unknown[0]}.` }
  }

  if (partial && Object.keys(fields).length === 0) {
    return { error: "At least one job field is required." }
  }

  if (fields.company !== undefined && !fields.company.trim()) {
    return { error: "Company is required." }
  }

  if (fields.role !== undefined && !fields.role.trim()) {
    return { error: "Role is required." }
  }

  if (fields.status !== undefined && !ALLOWED_STATUSES.has(fields.status)) {
    return { error: "Status must be Applied, Interviewed, or Rejected." }
  }

  if (fields.dateApplied !== undefined) {
    const date = fields.dateApplied

    const parsedDate = new Date(`${date}T00:00:00.000Z`)

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date ||
      date > new Date().toISOString().slice(0, 10)
    ) {
      return {
        error: "dateApplied must be a valid date that is not in the future.",
      }
    }
  }

  return { fields }
}

function parseJobId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null

  const id = Number(value)

  return Number.isSafeInteger(id) ? id : null
}

function issueToken(user, secret) {
  return jwt.sign({ sub: String(user.id) }, secret, {
    algorithm: "HS256",

    expiresIn: TOKEN_LIFETIME,
  })
}

export function createApp({
  pool,
  jwtSecret,
  frontendOrigin,
  nodeEnv = "development",
}) {
  if (!pool || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL-compatible pool is required.")
  }

  if (typeof jwtSecret !== "string" || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes.")
  }

  const app = express()

  const allowedOrigin =
    typeof frontendOrigin === "string" ? frontendOrigin.replace(/\/+$/, "") : ""

  app.disable("x-powered-by")

  app.set("trust proxy", 1)

  app.use(helmet())

  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          origin === allowedOrigin ||
          (nodeEnv !== "production" && LOCAL_ORIGINS.has(origin))
        ) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      },

      methods: ["GET", "POST", "PATCH", "DELETE"],

      allowedHeaders: ["Content-Type", "Authorization"],

      maxAge: 600,
    }),
  )

  app.use(express.json({ limit: "32kb", strict: true }))

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 20,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: { error: "Too many authentication attempts. Try again later." },
  })

  async function authenticate(req, res, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") || "")

    if (!match) {
      return res.status(401).json({ error: "Authentication required." })
    }

    try {
      const payload = jwt.verify(match[1], jwtSecret, { algorithms: ["HS256"] })

      if (
        typeof payload !== "object" ||
        typeof payload.sub !== "string" ||
        !/^[1-9]\d*$/.test(payload.sub)
      ) {
        return res.status(401).json({ error: "Invalid or expired token." })
      }

      req.userId = Number(payload.sub)

      return next()
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." })
    }
  }

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }))

  app.post("/auth/register", authLimiter, async (req, res) => {
    const validated = validUserInput(req.body)

    if (validated.error) return res.status(400).json({ error: validated.error })

    const passwordHash = await bcrypt.hash(validated.password, PASSWORD_ROUNDS)

    try {
      const { rows } = await pool.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",

        [validated.username, passwordHash],
      )

      const user = publicUser(rows[0])

      return res.status(201).json({ token: issueToken(user, jwtSecret), user })
    } catch (error) {
      if (error?.code === "23505") {
        return res
          .status(409)
          .json({ error: "That username is already registered." })
      }

      throw error
    }
  })

  app.post("/auth/login", authLimiter, async (req, res) => {
    const validated = validUserInput(req.body)

    if (validated.error) return res.status(400).json({ error: validated.error })

    const { rows } = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",

      [validated.username],
    )

    const user = rows[0]

    if (
      !user ||
      !(await bcrypt.compare(validated.password, user.password_hash))
    ) {
      return res.status(401).json({ error: "Invalid username or password." })
    }

    const safeUser = publicUser(user)

    return res
      .status(200)
      .json({ token: issueToken(safeUser, jwtSecret), user: safeUser })
  })

  app.get("/auth/me", authenticate, async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, username FROM users WHERE id = $1",

      [req.userId],
    )

    if (!rows[0])
      return res.status(401).json({ error: "Invalid or expired token." })

    return res.status(200).json(publicUser(rows[0]))
  })

  app.get("/jobs", authenticate, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT ${JOB_COLUMNS} FROM jobs WHERE user_id = $1 ORDER BY date_applied DESC, id DESC`,

      [req.userId],
    )

    return res.status(200).json(rows)
  })

  app.post("/jobs", authenticate, async (req, res) => {
    const validated = validateJob(req.body)

    if (validated.error) return res.status(400).json({ error: validated.error })

    const fields = validated.fields

    const columns = Object.values(JOB_FIELDS).map(({ column }) => column)

    const values = [
      req.userId,

      ...Object.keys(JOB_FIELDS).map((field) => fields[field]),
    ]

    const placeholders = values.map((_, index) => `$${index + 1}`)

    const { rows } = await pool.query(
      `INSERT INTO jobs (user_id, ${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING ${JOB_COLUMNS}`,

      values,
    )

    return res.status(201).json(rows[0])
  })

  app.patch("/jobs/:id", authenticate, async (req, res) => {
    const id = parseJobId(req.params.id)

    if (id === null)
      return res
        .status(400)
        .json({ error: "Job ID must be a positive integer." })

    const validated = validateJob(req.body, { partial: true })

    if (validated.error) return res.status(400).json({ error: validated.error })

    const entries = Object.entries(validated.fields)

    const assignments = entries.map(
      ([field], index) => `${JOB_FIELDS[field].column} = $${index + 1}`,
    )

    const values = entries.map(([, value]) => value)

    values.push(id, req.userId)

    const { rows } = await pool.query(
      `UPDATE jobs SET ${assignments.join(", ")}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING ${JOB_COLUMNS}`,

      values,
    )

    if (!rows[0]) return res.status(404).json({ error: "Job not found." })

    return res.status(200).json(rows[0])
  })

  app.delete("/jobs/:id", authenticate, async (req, res) => {
    const id = parseJobId(req.params.id)

    if (id === null)
      return res
        .status(400)
        .json({ error: "Job ID must be a positive integer." })

    const { rows } = await pool.query(
      "DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id",

      [id, req.userId],
    )

    if (!rows[0]) return res.status(404).json({ error: "Job not found." })

    return res.status(204).end()
  })

  app.use((_req, res) => res.status(404).json({ error: "Not found." }))

  app.use((error, _req, res, _next) => {
    if (error?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON request body." })
    }

    if (error?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large." })
    }

    console.error("API request failed.")

    return res
      .status(500)
      .json({ error: "An unexpected server error occurred." })
  })

  return app
}
