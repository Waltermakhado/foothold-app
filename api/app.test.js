import assert from "node:assert/strict"

import { after, before, test } from "node:test"

import { createApp } from "./app.js"

const jwtSecret = "test-only-secret-with-at-least-32-bytes"

class MemoryPool {
  users = []

  jobs = []

  nextUserId = 1

  nextJobId = 1

  async query(sql, values = []) {
    if (sql.startsWith("INSERT INTO users")) {
      const [username, password_hash] = values

      if (this.users.some((user) => user.username === username)) {
        const error = new Error("duplicate user")

        error.code = "23505"

        throw error
      }

      const user = { id: this.nextUserId++, username, password_hash }

      this.users.push(user)

      return { rows: [{ id: user.id, username }] }
    }

    if (sql.startsWith("SELECT id, username, password_hash FROM users")) {
      const user = this.users.find(
        (candidate) => candidate.username === values[0],
      )

      return { rows: user ? [user] : [] }
    }

    if (sql.startsWith("SELECT id, username FROM users")) {
      const user = this.users.find((candidate) => candidate.id === values[0])

      return { rows: user ? [{ id: user.id, username: user.username }] : [] }
    }

    if (sql.includes("FROM jobs WHERE user_id = $1")) {
      return {
        rows: this.jobs

          .filter((job) => job.userId === values[0])

          .sort((left, right) =>
            right.dateApplied.localeCompare(left.dateApplied),
          ),
      }
    }

    if (sql.startsWith("INSERT INTO jobs")) {
      const [
        userId,

        company,

        role,

        status,

        dateApplied,

        duties,

        address,

        contactEmail,

        contactPhone,

        website,

        requirements,

        notes,
      ] = values

      const job = {
        id: this.nextJobId++,

        userId,

        company,

        role,

        status,

        dateApplied,

        duties,

        address,

        contactEmail,

        contactPhone,

        website,

        requirements,

        notes,
      }

      this.jobs.push(job)

      return { rows: [job] }
    }

    if (sql.startsWith("UPDATE jobs SET")) {
      const assignments = sql
        .match(/^UPDATE jobs SET (.+)\s+WHERE/)[1]
        .split(", ")

      const id = values.at(-2)

      const userId = values.at(-1)

      const job = this.jobs.find(
        (candidate) => candidate.id === id && candidate.userId === userId,
      )

      if (!job) return { rows: [] }

      assignments.forEach((assignment, index) => {
        const column = assignment.split(" = ")[0]

        const field = Object.entries({
          company: "company",

          role: "role",

          status: "status",

          date_applied: "dateApplied",

          duties: "duties",

          address: "address",

          contact_email: "contactEmail",

          contact_phone: "contactPhone",

          website: "website",

          requirements: "requirements",

          notes: "notes",
        }).find(([name]) => name === column)[1]

        job[field] = values[index]
      })

      return { rows: [job] }
    }

    if (sql.startsWith("DELETE FROM jobs")) {
      const index = this.jobs.findIndex(
        (job) => job.id === values[0] && job.userId === values[1],
      )

      if (index < 0) return { rows: [] }

      const [job] = this.jobs.splice(index, 1)

      return { rows: [{ id: job.id }] }
    }

    throw new Error(`Unexpected query: ${sql}`)
  }
}

const pool = new MemoryPool()

let server

let baseUrl

let aliceToken

let bobToken

let jobId

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)

  if (token) headers.set("Authorization", `Bearer ${token}`)

  if (options.body) headers.set("Content-Type", "application/json")

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,

    headers,

    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const body = response.status === 204 ? null : await response.json()

  return { response, body }
}

before(async () => {
  const app = createApp({
    pool,
    jwtSecret,
    frontendOrigin: "https://example.test",
  })

  server = app.listen(0, "127.0.0.1")

  await new Promise((resolve) => server.once("listening", resolve))

  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})

test("registers and logs in without exposing password hashes", async () => {
  const registered = await request("/auth/register", {
    method: "POST",

    body: { username: "Alice", password: "a-secure-password" },
  })

  assert.equal(registered.response.status, 201)

  assert.deepEqual(registered.body.user, { id: 1, username: "alice" })

  assert.equal(typeof registered.body.token, "string")

  assert.equal("password_hash" in registered.body, false)

  assert.notEqual(pool.users[0].password_hash, "a-secure-password")

  aliceToken = registered.body.token

  const loggedIn = await request("/auth/login", {
    method: "POST",

    body: { username: "alice", password: "a-secure-password" },
  })

  assert.equal(loggedIn.response.status, 200)

  assert.deepEqual(loggedIn.body.user, { id: 1, username: "alice" })

  const duplicate = await request("/auth/register", {
    method: "POST",

    body: { username: "alice", password: "a-secure-password" },
  })

  assert.equal(duplicate.response.status, 409)

  const wrongPassword = await request("/auth/login", {
    method: "POST",

    body: { username: "alice", password: "incorrect-password" },
  })

  assert.equal(wrongPassword.response.status, 401)
})

test("requires authorization and returns the token user", async () => {
  const unauthorized = await request("/jobs")

  assert.equal(unauthorized.response.status, 401)

  const current = await request("/auth/me", { token: aliceToken })

  assert.equal(current.response.status, 200)

  assert.deepEqual(current.body, { id: 1, username: "alice" })
})

test("validates jobs and isolates listing, updates, and deletes by owner", async () => {
  const created = await request("/jobs", {
    method: "POST",

    token: aliceToken,

    body: {
      company: "Example Inc",

      role: "Engineer",

      status: "Applied",

      dateApplied: "2026-01-15",

      duties: "",

      address: "",

      contactEmail: "",

      contactPhone: "",

      website: "",

      requirements: "",

      notes: "",

      userId: 2,
    },
  })

  assert.equal(created.response.status, 400)
  assert.equal(pool.jobs.length, 0)

  const invalidDate = await request("/jobs", {
    method: "POST",
    token: aliceToken,
    body: {
      company: "Example Inc",
      role: "Engineer",
      status: "Applied",
      dateApplied: "2026-02-30",
      duties: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      requirements: "",
      notes: "",
    },
  })
  assert.equal(invalidDate.response.status, 400)

  const job = await request("/jobs", {
    method: "POST",

    token: aliceToken,

    body: {
      company: "Example Inc",

      role: "Engineer",

      status: "Applied",

      dateApplied: "2026-01-15",

      duties: "",

      address: "",

      contactEmail: "",

      contactPhone: "",

      website: "",

      requirements: "",

      notes: "",
    },
  })

  assert.equal(job.response.status, 201)

  assert.equal(job.body.userId, 1)

  jobId = job.body.id

  const bob = await request("/auth/register", {
    method: "POST",

    body: { username: "bob", password: "another-secure-password" },
  })

  assert.equal(bob.response.status, 201)

  bobToken = bob.body.token

  const bobJobs = await request("/jobs", { token: bobToken })

  assert.deepEqual(bobJobs.body, [])

  const stolenUpdate = await request(`/jobs/${jobId}`, {
    method: "PATCH",

    token: bobToken,

    body: { notes: "not yours" },
  })

  assert.equal(stolenUpdate.response.status, 404)

  const stolenDelete = await request(`/jobs/${jobId}`, {
    method: "DELETE",

    token: bobToken,
  })

  assert.equal(stolenDelete.response.status, 404)

  const updated = await request(`/jobs/${jobId}`, {
    method: "PATCH",

    token: aliceToken,

    body: { notes: "Follow up next week." },
  })

  assert.equal(updated.response.status, 200)

  assert.equal(updated.body.notes, "Follow up next week.")

  const deleted = await request(`/jobs/${jobId}`, {
    method: "DELETE",

    token: aliceToken,
  })

  assert.equal(deleted.response.status, 204)

  assert.equal(pool.jobs.length, 0)
})

test("serves health and applies configured CORS policy", async () => {
  const health = await request("/health", {
    headers: { Origin: "https://example.test" },
  })

  assert.equal(health.response.status, 200)

  assert.equal(
    health.response.headers.get("access-control-allow-origin"),
    "https://example.test",
  )

  assert.equal(health.response.headers.get("x-powered-by"), null)

  const blocked = await request("/health", {
    headers: { Origin: "https://attacker.example" },
  })

  assert.equal(
    blocked.response.headers.get("access-control-allow-origin"),
    null,
  )
})
