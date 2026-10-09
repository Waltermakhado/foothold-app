import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"

type Status = "Applied" | "Interviewed" | "Rejected"
type User = {
  id: number
  username: string
  password: string
}
type Job = {
  id: number
  userId: number
  company: string
  role: string
  status: Status
  dateApplied: string
  duties: string
  address: string
  contactEmail: string
  contactPhone: string
  website: string
  requirements: string
  notes: string
}

type Database = {
  users: User[]
  jobs: Job[]
}

const SESSION_KEY = "foothold-user-id"
const SESSION_USERNAME_KEY = "foothold-username"
const RETURN_TO_KEY = "foothold-return-to"
const emptyDatabase: Database = { users: [], jobs: [] }
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!response.ok) throw new Error(`API request failed (${response.status}).`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function readDatabase(): Promise<Database> {
  const [users, jobs] = await Promise.all([
    apiRequest<User[]>("/users"),
    apiRequest<Job[]>("/jobs"),
  ])
  return { users, jobs }
}

function getSessionUser(database: Database): User | null {
  const userId = Number(localStorage.getItem(SESSION_KEY))
  if (!userId) return null
  return database.users.find((user) => user.id === userId) || null
}

function endSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_USERNAME_KEY)
  go("/")
}

const statusIcons: Record<Status, string> = {
  Applied: "clock",
  Interviewed: "check",
  Rejected: "x",
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    folder: (
      <>
        <path d="M3 7.5V5.8A1.8 1.8 0 0 1 4.8 4h4l2 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />
        <path d="M3 8h18" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 7" />,
    x: <path d="m7 7 10 10M17 7 7 17" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <path d="m15 18-6-6 6-6" />,
    external: (
      <>
        <path d="M14 5h5v5M12 12l7-7" />
        <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </>
    ),
    alert: (
      <>
        <path d="M12 4 3.5 19h17L12 4Z" />
        <path d="M12 9v4M12 16h.01" />
      </>
    ),
    close: <path d="m7 7 10 10M17 7 7 17" />,
    sparkle: (
      <>
        <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "danger" | "ghost"
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button
      className={`logo ${light ? "logo-light" : ""}`}
      onClick={() => go("/")}
    >
      <span className="logo-mark">
        <Icon name="folder" size={21} />
      </span>
      <span>Foothold</span>
    </button>
  )
}

function go(path: string) {
  window.history.pushState({}, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function Header({ loggedIn }: { loggedIn: boolean }) {
  const username = loggedIn
    ? localStorage.getItem(SESSION_USERNAME_KEY) || "your account"
    : null
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          {loggedIn ? (
            <nav className="desktop-nav" aria-label="Main navigation">
              <span className="signed-in">
                Signed in as <strong>{username}</strong>
              </span>
              <NavButton
                label="Applications"
                icon="grid"
                onClick={() => go("/home")}
              />
              <NavButton
                label="Add job"
                icon="plus"
                onClick={() => go("/jobs/new")}
              />
              <NavButton
                label="Log out"
                icon="logout"
                onClick={endSession}
              />
            </nav>
          ) : (
            <nav className="guest-nav" aria-label="Main navigation">
              <button
                className="nav-link about-link"
                onClick={() => go("/#how")}
              >
                About
              </button>
              <button className="nav-link" onClick={() => go("/login")}>
                Log in
              </button>
              <Button className="header-button" onClick={() => go("/register")}>
                Sign up
              </Button>
            </nav>
          )}
        </div>
      </header>
      {loggedIn && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavButton
            label="Applications"
            icon="grid"
            active={window.location.pathname === "/home"}
            onClick={() => go("/home")}
          />
          <NavButton
            label="Add job"
            icon="plus"
            active={window.location.pathname === "/jobs/new"}
            onClick={() => go("/jobs/new")}
          />
          <NavButton label="Log out" icon="logout" onClick={endSession} />
        </nav>
      )}
    </>
  )
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  )
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <Icon name={statusIcons[status]} size={16} />
      {status}
    </span>
  )
}

function Landing({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <div className="page">
      <Header loggedIn={loggedIn} />
      <main id="main">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">
                <Icon name="sparkle" size={16} /> A calmer job search
              </span>
              <h1>Know where every application stands.</h1>
              <p>
                Foothold keeps your job applications, their status and the
                company details in one place, so you walk into every interview
                prepared.
              </p>
              <div className="hero-actions">
                <Button variant="secondary" onClick={() => go("/register")}>
                  Create a free account
                </Button>
                <Button variant="ghost" onClick={() => go("/login")}>
                  Log in
                </Button>
              </div>
              <p className="hero-note">
                <Icon name="check" size={17} /> Free to use. No credit card
                needed.
              </p>
            </div>
            <div
              className="hero-preview hero-legend"
              aria-label="Application status legend"
            >
              <div className="preview-title">
                <span>A clear place to begin</span>
                <Icon name="folder" size={18} />
              </div>
              <div className="empty-card-illustration" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>One organised view for every step of your search.</p>
              <div className="status-legend">
                {(["Applied", "Interviewed", "Rejected"] as Status[]).map(
                  (status) => (
                    <StatusBadge status={status} key={status} />
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="section section-centered" id="how">
          <span className="section-kicker">Simple by design</span>
          <h2>How it works</h2>
          <p className="section-intro">
            A clear view of your search, from first application to final answer.
          </p>
          <div className="steps">
            {[
              [
                "01",
                "Add an application",
                "Save the role, company and the details you will need later.",
              ],
              [
                "02",
                "Update its status",
                "Move each application forward as soon as you hear back.",
              ],
              [
                "03",
                "See the full picture",
                "Filter your list and focus on the next useful action.",
              ],
            ].map(([n, title, body]) => (
              <article className="step-card" key={n}>
                <span className="step-number">{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section feature-section">
          <div className="feature-heading">
            <span className="section-kicker">Ready when you are</span>
            <h2>
              Built for the interview,
              <br />
              not just the list.
            </h2>
          </div>
          <div className="feature-list">
            {[
              "Company address, contacts and website saved with each job",
              "Colour, icon and label for every status",
              "Search, filter and sort stay in the web address",
              "Comfortable to use on any screen",
            ].map((item) => (
              <div className="feature" key={item}>
                <span className="check">
                  <Icon name="check" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <Logo />
        <span>Keep moving forward, one application at a time.</span>
        <span>© 2025 Foothold</span>
      </footer>
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {children}
      {error && (
        <span className="error-text">
          <Icon name="alert" size={16} />
          {error}
        </span>
      )}
    </label>
  )
}

function AuthPage({ mode }: { mode: "register" | "login" }) {
  const register = mode === "register"
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const username = String(form.get("username") || "").trim()
    const password = String(form.get("password") || "")
    const repeatPassword = String(form.get("repeat-password") || "")
    const nextErrors: Record<string, string> = {}
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username))
      nextErrors.username =
        "Use 3 to 20 letters, numbers or underscores."
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password))
      nextErrors.password =
        "Use at least 8 characters, with a letter and a number."
    if (register && repeatPassword !== password)
      nextErrors.repeatPassword = "Passwords must match."
    setFieldErrors(nextErrors)
    setError("")
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const users = await apiRequest<User[]>("/users")
      if (
        register &&
        users.some(
          (user) => user.username.toLowerCase() === username.toLowerCase(),
        )
      ) {
        setError("That username is taken. Try another one.")
        return
      }

      const matchedUser = register
        ? null
        : users.find(
            (user) => user.username === username && user.password === password,
          )
      if (!register && !matchedUser) {
        setError("Username or password is incorrect.")
        return
      }

      const user = register
        ? await apiRequest<User>("/users", {
            method: "POST",
            body: JSON.stringify({ username, password }),
          })
        : matchedUser!
      localStorage.setItem(SESSION_KEY, String(user.id))
      localStorage.setItem(SESSION_USERNAME_KEY, user.username)
      const returnTo = sessionStorage.getItem(RETURN_TO_KEY)
      sessionStorage.removeItem(RETURN_TO_KEY)
      go(!register && returnTo ? returnTo : "/home")
    } catch {
      setError("Couldn't reach the API. Start JSON Server and try again.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="page auth-page">
      <Header loggedIn={false} />
      <main id="main" className="auth-main">
        <div className="auth-form-pane">
          <div className="auth-intro">
            <span className="auth-icon">
              <Icon name="folder" size={27} />
            </span>
            <span className="auth-kicker">Your search, beautifully organised</span>
            <h1>{register ? "Create an account" : "Welcome back"}</h1>
            <p>
              {register
                ? "Start keeping your job search clear and organised."
                : "Pick up exactly where you left off."}
            </p>
          </div>
          <form className="auth-card" onSubmit={submit}>
            {error && (
              <div className="error-banner" role="alert">
                <Icon name="alert" />
                <span>{error}</span>
              </div>
            )}
            <Field
              label="Username"
              error={fieldErrors.username}
              hint={
                register ? "3 to 20 letters, numbers or underscores" : undefined
              }
            >
              <input
                name="username"
                autoComplete="username"
                placeholder="e.g. alex_m"
              />
            </Field>
            <Field
              label="Password"
              error={fieldErrors.password}
              hint={
                register
                  ? "At least 8 characters, with a letter and a number"
                  : undefined
              }
            >
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
              />
            </Field>
            {register && (
              <Field
                label="Repeat password"
                error={fieldErrors.repeatPassword}
              >
                <input
                  name="repeat-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                />
              </Field>
            )}
            <label className="check-control">
              <input
                type="checkbox"
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
              />
              <span>{register ? "Show passwords" : "Show password"}</span>
            </label>
            <Button className="full-button" type="submit" disabled={loading}>
              {loading && <Spinner />}
              {loading
                ? register
                  ? "Creating account…"
                  : "Logging in…"
                : register
                  ? "Create account"
                  : "Log in"}
            </Button>
            <p className="auth-switch">
              {register ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={() => go(register ? "/login" : "/register")}
              >
                {register ? "Log in" : "Create an account"}
              </button>
            </p>
          </form>
        </div>
        <aside className="auth-visual" aria-label="A welcoming job interview">
          <img
            src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1400&q=88"
            alt="Two professionals having a friendly conversation in a bright office"
          />
          <div className="visual-wash" />
          <div className="visual-note visual-note-top">
            <span className="visual-dot" />
            <div>
              <strong>Interview ready</strong>
              <span>Everything you need, in one place</span>
            </div>
          </div>
          <div className="visual-quote">
            <Icon name="sparkle" size={19} />
            <p>“A calmer way to move your career forward.”</p>
            <span>FOOTHOLD</span>
          </div>
          <div className="visual-status">
            <span>Next up</span>
            <strong>Interview · 10:30</strong>
            <div className="avatar-stack" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
          <a
            className="photo-credit"
            href="https://unsplash.com/@wocintechchat"
            target="_blank"
            rel="noreferrer"
          >
            Photo by Christina @ wocintechchat.com
          </a>
        </aside>
      </main>
    </div>
  )
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}

function StatTile({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`stat-tile stat-${label.toLowerCase()} ${
        selected ? "selected" : ""
      }`}
      onClick={onClick}
    >
      <strong>{count}</strong>
      <span>{label}</span>
    </button>
  )
}

function JobCard({ job, onDelete }: { job: Job; onDelete: (job: Job) => void }) {
  return (
    <article className={`job-card edge-${job.status.toLowerCase()}`}>
      <div className="job-meta">
        <StatusBadge status={job.status} />
        <time>{formatDate(job.dateApplied)}</time>
      </div>
      <button className="job-title" onClick={() => go(`/jobs/${job.id}`)}>
        {job.role}
      </button>
      <p>{job.company}</p>
      <div className="job-card-actions">
        <Button variant="secondary" onClick={() => go(`/jobs/${job.id}/edit`)}>
          Edit
        </Button>
        <Button variant="danger" onClick={() => onDelete(job)}>
          Delete
        </Button>
      </div>
    </article>
  )
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function Home({
  jobs,
  removeJob,
}: {
  jobs: Job[]
  removeJob: (id: number) => Promise<void>
}) {
  const params = new URLSearchParams(window.location.search)
  const [search, setSearch] = useState(params.get("search") || "")
  const [status, setStatus] = useState(params.get("status") || "All")
  const [sort, setSort] = useState(params.get("sort") || "newest")
  const [deleting, setDeleting] = useState<Job | null>(null)
  const [toast, setToast] = useState("")
  useEffect(() => {
    const query = new URLSearchParams()
    if (search) query.set("search", search)
    if (status !== "All") query.set("status", status)
    if (sort !== "newest") query.set("sort", sort)
    window.history.replaceState({}, "", `/home${query.size ? `?${query}` : ""}`)
  }, [search, status, sort])
  const filtered = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            (status === "All" || j.status === status) &&
            `${j.company} ${j.role}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "newest"
            ? b.dateApplied.localeCompare(a.dateApplied)
            : a.dateApplied.localeCompare(b.dateApplied),
        ),
    [jobs, search, status, sort],
  )
  const chooseStatus = (next: string) => setStatus(next)
  const clear = () => {
    setSearch("")
    setStatus("All")
    setSort("newest")
  }
  const confirmDelete = async () => {
    if (!deleting) return
    const message = `Deleted ${deleting.role} at ${deleting.company}.`
    try {
      await removeJob(deleting.id)
      setDeleting(null)
      setToast(message)
    } catch {
      setToast("Couldn't delete this application. Check the API and retry.")
    }
  }
  return (
    <div className="page app-page">
      <Header loggedIn />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <main id="main" className="app-main">
        <div className="page-heading">
          <div>
            <span className="section-kicker">Your job search</span>
            <h1>My applications</h1>
            <p>Keep the next step clear and every detail close.</p>
          </div>
          <Button onClick={() => go("/jobs/new")}>
            <Icon name="plus" />
            Add job
          </Button>
        </div>
        <section aria-label="Application status" className="stats">
          <StatTile
            label="All"
            count={jobs.length}
            selected={status === "All"}
            onClick={() => chooseStatus("All")}
          />
          {(["Applied", "Interviewed", "Rejected"] as Status[]).map((s) => (
            <StatTile
              key={s}
              label={s}
              count={jobs.filter((j) => j.status === s).length}
              selected={status === s}
              onClick={() => chooseStatus(s)}
            />
          ))}
        </section>
        <section className="filter-card" aria-label="Search and filters">
          <Field label="Search company or role">
            <span className="input-icon">
              <Icon name="search" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try “Developer”"
              />
            </span>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>Applied</option>
              <option>Interviewed</option>
              <option>Rejected</option>
            </select>
          </Field>
          <Field label="Date applied">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </Field>
          {(search || status !== "All" || sort !== "newest") && (
            <Button variant="ghost" onClick={clear}>
              Clear filters
            </Button>
          )}
        </section>
        <div className="results-line">
          <span>
            Showing <strong>{filtered.length}</strong> of {jobs.length}{" "}
            applications
          </span>
          <span>Sorted by {sort === "newest" ? "newest" : "oldest"}</span>
        </div>
        {filtered.length ? (
          <section className="job-grid" aria-label="Applications">
            {filtered.map((job) => (
              <JobCard job={job} key={job.id} onDelete={setDeleting} />
            ))}
          </section>
        ) : (
          <EmptyState
            filtered={jobs.length > 0}
            onAction={jobs.length ? clear : () => go("/jobs/new")}
          />
        )}
      </main>
      {deleting && (
        <DeleteModal
          job={deleting}
          close={() => setDeleting(null)}
          confirm={confirmDelete}
        />
      )}
    </div>
  )
}

function EmptyState({
  filtered,
  onAction,
}: {
  filtered: boolean
  onAction: () => void
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={filtered ? "search" : "folder"} size={30} />
      </span>
      <h2>
        {filtered ? "Nothing matches those filters" : "No applications yet"}
      </h2>
      <p>
        {filtered
          ? "Try changing or clearing your search and filters."
          : "Add your first application and take the next step."}
      </p>
      <Button onClick={onAction}>
        {filtered ? "Clear filters" : "Add your first job"}
      </Button>
    </div>
  )
}

function DeleteModal({
  job,
  close,
  confirm,
}: {
  job: Job
  close: () => void
  confirm: () => void
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <span className="danger-icon">
          <Icon name="alert" size={26} />
        </span>
        <h2 id="modal-title">Delete this application?</h2>
        <p>
          <strong>{job.role}</strong> at <strong>{job.company}</strong> will be
          removed. You can't undo this.
        </p>
        <div className="modal-actions">
          <Button variant="danger" onClick={confirm}>
            Delete application
          </Button>
          <Button variant="secondary" onClick={close}>
            Keep it
          </Button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <span className="toast-check">
        <Icon name="check" size={17} />
      </span>
      <span>{message}</span>
      <button aria-label="Close notification" onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  )
}

function JobDetail({ job, onDelete }: { job: Job; onDelete: () => void }) {
  const [modal, setModal] = useState(false)
  return (
    <div className="page app-page">
      <Header loggedIn />
      <main id="main" className="app-main detail-main">
        <button className="back-link" onClick={() => go("/home")}>
          <Icon name="arrow" />
          Back to applications
        </button>
        <article className={`detail-card edge-${job.status.toLowerCase()}`}>
          <div className="detail-hero">
            <StatusBadge status={job.status} />
            <h1>{job.role}</h1>
            <p className="detail-company">{job.company}</p>
            <p>Applied on {formatDate(job.dateApplied)}</p>
          </div>
          <DetailSection title="Job duties">
            <p>{job.duties}</p>
          </DetailSection>
          {job.requirements && (
            <DetailSection title="Requirements">
              <p>{job.requirements}</p>
            </DetailSection>
          )}
          {(job.address ||
            job.contactEmail ||
            job.contactPhone ||
            job.website) && (
            <DetailSection title="Company details">
              <dl className="details-list">
                {job.address && (
                  <div>
                    <dt>Address</dt>
                    <dd>{job.address}</dd>
                  </div>
                )}
                {job.contactEmail && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${job.contactEmail}`}>
                        {job.contactEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {job.contactPhone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      <a href={`tel:${job.contactPhone}`}>
                        {job.contactPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {job.website && (
                  <div>
                    <dt>Website</dt>
                    <dd>
                      <a href={job.website} target="_blank" rel="noreferrer">
                        Visit company website <Icon name="external" size={16} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </DetailSection>
          )}
          {job.notes && (
            <DetailSection title="Notes">
              <div className="notes-box">{job.notes}</div>
            </DetailSection>
          )}
          <div className="detail-actions">
            <Button onClick={() => go(`/jobs/${job.id}/edit`)}>
              Edit application
            </Button>
            <Button variant="danger" onClick={() => setModal(true)}>
              Delete
            </Button>
          </div>
        </article>
      </main>
      {modal && (
        <DeleteModal
          job={job}
          close={() => setModal(false)}
          confirm={onDelete}
        />
      )}
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function JobForm({
  existing,
  userId,
  save,
}: {
  existing?: Job
  userId: number
  save: (job: Job) => Promise<void>
}) {
  const editing = Boolean(existing)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>
    const nextErrors: Record<string, string> = {}
    if (!data.company.trim()) nextErrors.company = "Enter the company name."
    if (!data.role.trim()) nextErrors.role = "Enter the role."
    if (!data.dateApplied)
      nextErrors.dateApplied = "Choose the date you applied."
    else if (data.dateApplied > new Date().toISOString().slice(0, 10))
      nextErrors.dateApplied = "The date can't be in the future."
    if (!data.duties.trim()) nextErrors.duties = "Describe the main job duties."
    if (
      data.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)
    )
      nextErrors.contactEmail =
        "Enter a valid email, like name@company.com."
    if (data.website && !/^https:\/\//.test(data.website))
      nextErrors.website = "Start the website address with https://"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setLoading(true)
    try {
      await save({
        ...data,
        id: existing?.id || Date.now(),
        userId,
        status: data.status as Status,
      } as unknown as Job)
    } catch {
      setErrors({ form: "Couldn't save this application. Check the API and retry." })
      setLoading(false)
    }
  }
  const value = (key: keyof Job) => String(existing?.[key] || "")
  return (
    <div className="page app-page">
      <Header loggedIn />
      <main id="main" className="app-main form-main">
        <button
          className="back-link"
          onClick={() => go(editing ? `/jobs/${existing!.id}` : "/home")}
        >
          <Icon name="arrow" />
          {editing ? "Back to application" : "Back to applications"}
        </button>
        <div className="form-heading">
          <span className="section-kicker">
            {editing ? "Update the details" : "Track a new opportunity"}
          </span>
          <h1>{editing ? "Edit application" : "Add a job"}</h1>
          <p>
            Keep the useful details together. You can change them at any time.
          </p>
        </div>
        <form className="job-form" onSubmit={submit}>
          {errors.form && (
            <div className="error-banner" role="alert">
              <Icon name="alert" />
              <span>{errors.form}</span>
            </div>
          )}
          <FormGroup
            number="1"
            title="The application"
            description="The essentials that help you recognise and track this role."
          >
            <div className="form-grid">
              <Field label="Company name (required)" error={errors.company}>
                <input
                  name="company"
                  defaultValue={value("company")}
                  placeholder="e.g. Acme Ltd"
                />
              </Field>
              <Field label="Role (required)" error={errors.role}>
                <input
                  name="role"
                  defaultValue={value("role")}
                  placeholder="e.g. Product designer"
                />
              </Field>
              <Field label="Status (required)">
                <select
                  name="status"
                  defaultValue={existing?.status || "Applied"}
                >
                  <option>Applied</option>
                  <option>Interviewed</option>
                  <option>Rejected</option>
                </select>
              </Field>
              <Field
                label="Date applied (required)"
                error={errors.dateApplied}
              >
                <input
                  name="dateApplied"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  defaultValue={value("dateApplied")}
                />
              </Field>
              <div className="span-full">
                <Field
                  label="Job duties (required)"
                  hint="What will you be doing day to day?"
                  error={errors.duties}
                >
                  <textarea
                    name="duties"
                    rows={5}
                    defaultValue={value("duties")}
                  />
                </Field>
              </div>
            </div>
          </FormGroup>
          <FormGroup
            number="2"
            title="Company details"
            description="Optional details to help you prepare when an interview arrives."
          >
            <div className="form-grid">
              <div className="span-full">
                <Field label="Address">
                  <input
                    name="address"
                    defaultValue={value("address")}
                    placeholder="e.g. 12 Main Road, Cape Town"
                  />
                </Field>
              </div>
              <Field
                label="Contact email"
                error={errors.contactEmail}
              >
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={value("contactEmail")}
                  placeholder="e.g. hiring@company.com"
                />
              </Field>
              <Field label="Contact phone">
                <input
                  name="contactPhone"
                  type="tel"
                  defaultValue={value("contactPhone")}
                  placeholder="e.g. +27 11 555 0100"
                />
              </Field>
              <div className="span-full">
                <Field
                  label="Company website"
                  hint="Start with https://"
                  error={errors.website}
                >
                  <input
                    name="website"
                    type="url"
                    defaultValue={value("website")}
                    placeholder="https://company.com"
                  />
                </Field>
              </div>
              <div className="span-full">
                <Field label="Requirements">
                  <textarea
                    name="requirements"
                    rows={4}
                    defaultValue={value("requirements")}
                  />
                </Field>
              </div>
              <div className="span-full">
                <Field label="Notes">
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={value("notes")}
                  />
                </Field>
              </div>
            </div>
          </FormGroup>
          <div className="form-actions">
            <Button type="submit" disabled={loading}>
              {loading && <Spinner />}
              {loading
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Save application"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => go(editing ? `/jobs/${existing!.id}` : "/home")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

function FormGroup({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="form-group">
      <div className="form-group-heading">
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function NotFound({
  missingJob = false,
  loggedIn = true,
}: {
  missingJob?: boolean
  loggedIn?: boolean
}) {
  return (
    <div className="page app-page">
      <Header loggedIn={loggedIn} />
      <main id="main" className="not-found">
        <span className="big-404">404</span>
        <h1>
          {missingJob
            ? "That application isn't here"
            : "We can't find that page"}
        </h1>
        <p>
          {missingJob
            ? "That application doesn't exist, or it isn't yours."
            : "The link may be broken, or the page may have been removed."}
        </p>
        <Button onClick={() => go(loggedIn ? "/home" : "/")}>
          {loggedIn ? "Back to my applications" : "Back to the start"}
        </Button>
      </main>
    </div>
  )
}

function Redirect({ to, remember }: { to: string; remember?: string }) {
  useEffect(() => {
    if (remember) sessionStorage.setItem(RETURN_TO_KEY, remember)
    // A full replace is intentional here: on a direct protected-page load,
    // child effects run before App has attached its history listener.
    window.location.replace(to)
  }, [remember, to])
  return null
}

export default function App() {
  const [route, setRoute] = useState(window.location.pathname)
  const [database, setDatabase] = useState<Database>(emptyDatabase)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState("")
  const refreshDatabase = async () => {
    setLoading(true)
    setApiError("")
    try {
      setDatabase(await readDatabase())
    } catch {
      setApiError("Couldn't connect to JSON Server. Start it and retry.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const update = () => {
      setRoute(window.location.pathname)
      void refreshDatabase()
    }
    void refreshDatabase()
    window.addEventListener("popstate", update)
    return () => window.removeEventListener("popstate", update)
  }, [])
  const user = getSessionUser(database)
  const isProtected =
    route === "/home" ||
    route === "/jobs/new" ||
    /^\/jobs\/\d+(?:\/edit)?$/.test(route)

  if (loading)
    return (
      <main className="auth-main" aria-live="polite">
        <p>Connecting to your applications...</p>
      </main>
    )
  if (apiError)
    return (
      <main className="auth-main">
        <div className="error-banner" role="alert">
          <Icon name="alert" />
          <span>{apiError}</span>
        </div>
        <Button onClick={() => void refreshDatabase()}>Retry connection</Button>
      </main>
    )

  if (!user && isProtected)
    return <Redirect to="/login" remember={`${route}${window.location.search}`} />
  if (user && (route === "/login" || route === "/register"))
    return <Redirect to="/home" />
  if (route === "/") return <Landing loggedIn={Boolean(user)} />
  if (route === "/register") return <AuthPage mode="register" />
  if (route === "/login") return <AuthPage mode="login" />
  if (route === "/home")
    return (
      <Home
        jobs={database.jobs.filter((job) => job.userId === user!.id)}
        removeJob={async (id) => {
          await apiRequest<void>(`/jobs/${id}`, { method: "DELETE" })
          setDatabase((current) => ({
            ...current,
            jobs: current.jobs.filter(
              (job) => job.id !== id || job.userId !== user!.id,
            ),
          }))
        }}
      />
    )
  if (route === "/jobs/new")
    return (
      <JobForm
        userId={user!.id}
        save={async (job) => {
          if (job.userId !== user!.id) return
          const created = await apiRequest<Job>("/jobs", {
            method: "POST",
            body: JSON.stringify(job),
          })
          setDatabase((current) => ({
            ...current,
            jobs: [...current.jobs, created],
          }))
          go(`/jobs/${created.id}`)
        }}
      />
    )
  const editMatch = route.match(/^\/jobs\/(\d+)\/edit$/)
  if (editMatch) {
    const job = database.jobs.find(
      (item) =>
        item.id === Number(editMatch[1]) && item.userId === user!.id,
    )
    return job ? (
      <JobForm
        existing={job}
        userId={user!.id}
        save={async (updated) => {
          if (updated.userId !== user!.id) return
          const saved = await apiRequest<Job>(`/jobs/${updated.id}`, {
            method: "PATCH",
            body: JSON.stringify(updated),
          })
          setDatabase((current) => ({
            ...current,
            jobs: current.jobs.map((item) =>
              item.id === saved.id && item.userId === user!.id ? saved : item,
            ),
          }))
          go(`/jobs/${saved.id}`)
        }}
      />
    ) : (
      <NotFound missingJob />
    )
  }
  const jobMatch = route.match(/^\/jobs\/(\d+)$/)
  if (jobMatch) {
    const job = database.jobs.find(
      (item) =>
        item.id === Number(jobMatch[1]) && item.userId === user!.id,
    )
    return job ? (
      <JobDetail
        job={job}
        onDelete={async () => {
          await apiRequest<void>(`/jobs/${job.id}`, { method: "DELETE" })
          setDatabase((current) => ({
            ...current,
            jobs: current.jobs.filter((item) => item.id !== job.id),
          }))
          go("/home")
        }}
      />
    ) : (
      <NotFound missingJob />
    )
  }
  return <NotFound loggedIn={Boolean(user)} />
}
