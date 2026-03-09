# Implementation Roadmap — BookReading V1

## Current Codebase State

```
bookreading/
├── PRD.md              ✅ Complete
├── TRD.md              ✅ Complete
├── client/             ❌ Empty
└── server/
    └── package.json    ❌ Bare scaffold (no deps, no code)
```

Everything starts from scratch. This roadmap defines the exact build order.

---

## Dependency Order (What Blocks What)

```
Phase 1: Server Foundation
  ├── 1.1 Project setup & deps
  ├── 1.2 Prisma schema + DB migration
  └── 1.3 Seed script
         │
Phase 2: Public API
  ├── 2.1 Category endpoints ──────────────────────┐
  ├── 2.2 Book endpoints (depends on categories)    │
  ├── 2.3 Chapter endpoints (depends on books)      │
  └── 2.4 Search endpoint (depends on books table)  │
         │                                          │
Phase 3: Admin API                                  │
  ├── 3.1 Admin auth (JWT + login)                  │
  ├── 3.2 Admin CRUD: categories                    │
  ├── 3.3 Admin CRUD: books + cover upload          │
  └── 3.4 Admin CRUD: chapters                      │
         │                                          │
Phase 4: Client Foundation                          │
  ├── 4.1 React + Vite setup                        │
  ├── 4.2 Routing + layout shell                    │
  └── 4.3 API service layer ◄──────────────────────┘
         │
Phase 5: Public Pages
  ├── 5.1 Homepage (featured books + categories)
  ├── 5.2 Category page (paginated books)
  ├── 5.3 Book detail page
  ├── 5.4 Reader (chapter display + navigation)
  └── 5.5 Search
         │
Phase 6: Admin Pages
  ├── 6.1 Admin login page
  ├── 6.2 Admin dashboard + category management
  └── 6.3 Admin book + chapter management
         │
Phase 7: Polish & Deploy
  ├── 7.1 Responsive pass
  ├── 7.2 Error/empty states
  └── 7.3 Production build + deployment config
```

---

## Phase 1: Server Foundation

> **Goal:** Running Express server connected to PostgreSQL with seeded data.

### Step 1.1 — Project Setup & Dependencies

| Action | Detail |
|--------|--------|
| Install server deps | `express`, `cors`, `helmet`, `dotenv`, `bcrypt`, `jsonwebtoken`, `express-validator`, `multer` |
| Install dev deps | `nodemon`, `prisma` |
| Install Prisma client | `@prisma/client` |
| Create `.env` | `DATABASE_URL`, `JWT_SECRET`, `PORT` |
| Create `.gitignore` | `node_modules/`, `.env`, `uploads/`, `prisma/*.db` |
| Add npm scripts | `dev` (nodemon), `start`, `seed`, `migrate` |
| Create `src/index.js` | Express app with helmet, cors, JSON parsing, error middleware |

**Blocked by:** Nothing. First step.
**Validates with:** Server starts on `PORT` and returns `{ status: "ok" }` on `GET /`.

### Step 1.2 — Prisma Schema & Migration

| Action | Detail |
|--------|--------|
| Run `npx prisma init` | Generates `prisma/schema.prisma` |
| Define 4 models | `Category`, `Book`, `Chapter`, `Admin` (per TRD Section 4) |
| Define relations | Category 1→* Book, Book 1→* Chapter |
| Define indexes | Full-text GIN on books(title, author), unique compound on chapters(book_id, order) |
| Run migration | `npx prisma migrate dev --name init` |

**Blocked by:** Step 1.1 (DATABASE_URL must exist).
**Validates with:** `npx prisma studio` opens and shows empty tables.

### Step 1.3 — Seed Script

| Action | Detail |
|--------|--------|
| Create `prisma/seed.js` | Insert 4–5 categories, 8–10 books, 2–3 chapters per book, 1 admin user |
| Hash admin password | bcrypt with cost 12 |
| Run seed | `npx prisma db seed` |

**Blocked by:** Step 1.2 (tables must exist).
**Validates with:** Query books in Prisma Studio; admin login works later.

---

## Phase 2: Public API

> **Goal:** All read-only endpoints functional and testable with curl/Postman.

### Step 2.1 — Category Endpoints

| Endpoint | File |
|----------|------|
| `GET /api/v1/categories` | `src/routes/categories.js` |
| `GET /api/v1/categories/:id/books` | Same file, paginated |

**Controller logic:** Prisma queries with pagination (`skip`, `take`).

### Step 2.2 — Book Endpoints

| Endpoint | File |
|----------|------|
| `GET /api/v1/books` | `src/routes/books.js` |
| `GET /api/v1/books/:id` | Same file, includes category relation |

**Query params:** `page`, `limit`, `featured` (boolean filter).

### Step 2.3 — Chapter Endpoints

| Endpoint | File |
|----------|------|
| `GET /api/v1/books/:id/chapters` | `src/routes/chapters.js` |
| `GET /api/v1/books/:id/chapters/:chapterId` | Same file, returns full content |

**Key detail:** Chapter list returns `id`, `title`, `order` only. Single chapter returns full `content`.

### Step 2.4 — Search Endpoint

| Endpoint | File |
|----------|------|
| `GET /api/v1/search?q=` | `src/routes/search.js` |

**Implementation:** PostgreSQL full-text search with `to_tsvector` / `to_tsquery` via Prisma raw query. Sanitize `q` parameter.

**Blocked by:** Phase 1 complete.
**Validates with:** curl requests return correct JSON; pagination works; search returns ranked results.

---

## Phase 3: Admin API

> **Goal:** Full CRUD for admin behind JWT auth.

### Step 3.1 — Admin Auth

| Component | File |
|-----------|------|
| Login endpoint | `POST /api/v1/admin/login` → `src/routes/admin/auth.js` |
| Auth middleware | `src/middleware/auth.js` — verify JWT on `/admin/*` routes |

**Flow:** Admin sends `{ username, password }` → server verifies bcrypt → returns JWT (24h expiry).

### Step 3.2 — Admin Category CRUD

| Endpoint | Action |
|----------|--------|
| `POST /api/v1/admin/categories` | Create (validate: name required, unique) |
| `PUT /api/v1/admin/categories/:id` | Update |
| `DELETE /api/v1/admin/categories/:id` | Delete (SET NULL on linked books) |

### Step 3.3 — Admin Book CRUD + Cover Upload

| Endpoint | Action |
|----------|--------|
| `POST /api/v1/admin/books` | Create (multipart form: metadata + cover image via multer) |
| `PUT /api/v1/admin/books/:id` | Update (optional new cover) |
| `DELETE /api/v1/admin/books/:id` | Delete (cascades chapters) |

**Static serving:** `express.static('uploads')` for cover images.

### Step 3.4 — Admin Chapter CRUD

| Endpoint | Action |
|----------|--------|
| `POST /api/v1/admin/books/:id/chapters` | Add chapter (validate: title, content, order) |
| `PUT /api/v1/admin/chapters/:id` | Update chapter |
| `DELETE /api/v1/admin/chapters/:id` | Delete chapter |

**Blocked by:** Phase 2 (public routes establish pattern), Step 3.1 (auth required).
**Validates with:** Full CRUD cycle via Postman with JWT header.

---

## Phase 4: Client Foundation

> **Goal:** React app running with routing, layout, and API service layer.

### Step 4.1 — React + Vite Setup

| Action | Detail |
|--------|--------|
| `npm create vite@latest . -- --template react` | Inside `client/` |
| Install deps | `react-router-dom`, `axios` (or use native fetch) |
| Configure Vite proxy | Proxy `/api` to `http://localhost:3000` for local dev |

### Step 4.2 — Routing + Layout Shell

| Route | Component |
|-------|-----------|
| `/` | `HomePage` |
| `/categories/:id` | `CategoryPage` |
| `/books/:id` | `BookDetailPage` |
| `/books/:id/read/:chapterId` | `ReaderPage` |
| `/search?q=` | `SearchResultsPage` |
| `/admin/login` | `AdminLoginPage` |
| `/admin/dashboard` | `AdminDashboard` |

**Layout:** Shared `Layout` component with header (logo, search bar, nav) and footer.

### Step 4.3 — API Service Layer

| File | Exports |
|------|---------|
| `src/services/api.js` | Axios instance with base URL, token interceptor |
| `src/services/books.js` | `getBooks()`, `getBook(id)`, `getChapters(bookId)`, `getChapter(bookId, chapterId)` |
| `src/services/categories.js` | `getCategories()`, `getCategoryBooks(id)` |
| `src/services/search.js` | `searchBooks(query)` |
| `src/services/admin.js` | `login()`, `createBook()`, `updateBook()`, `deleteBook()`, etc. |

**Blocked by:** Phase 3 complete (all API endpoints available).
**Validates with:** Vite dev server runs; routes render placeholder text; API calls return data in console.

---

## Phase 5: Public Pages

> **Goal:** All reader-facing pages functional with real data.

### Build Order (strict sequence — each page builds on the previous)

| Step | Page | Key Components | Data Source |
|------|------|----------------|-------------|
| 5.1 | **Homepage** | `BookCard`, `CategoryList`, `FeaturedBooks` | `GET /books?featured=true`, `GET /categories` |
| 5.2 | **Category Page** | `BookGrid`, `Pagination` | `GET /categories/:id/books` |
| 5.3 | **Book Detail** | `BookInfo`, `ChapterList` | `GET /books/:id`, `GET /books/:id/chapters` |
| 5.4 | **Reader** | `ChapterContent`, `ChapterNav` | `GET /books/:id/chapters/:chapterId` |
| 5.5 | **Search** | `SearchBar` (in layout), `SearchResults` | `GET /search?q=` |

**Why this order:** Homepage → Category is natural drill-down. Book detail is standalone. Reader depends on chapter data structure. Search is cross-cutting (added last to layout).

---

## Phase 6: Admin Pages

> **Goal:** Admin can log in and manage all content.

| Step | Page | Key Functionality |
|------|------|-------------------|
| 6.1 | **Admin Login** | Form → `POST /admin/login` → store JWT in memory/localStorage |
| 6.2 | **Category Mgmt** | Table list + create/edit/delete forms |
| 6.3 | **Book + Chapter Mgmt** | Book list + form (with cover upload), chapter editor per book |

**Auth guard:** React route wrapper checks for valid JWT; redirects to login if absent.

**Blocked by:** Phase 5 (reuse `BookCard`, `Pagination` components).
**Validates with:** Admin can create a category, add a book with cover, add chapters, and the book appears on the public homepage.

---

## Phase 7: Polish & Deploy

| Step | Action | Detail |
|------|--------|--------|
| 7.1 | Responsive pass | Test all pages at 320px, 768px, 1024px. Fix layout breaks. |
| 7.2 | Error/empty states | No-cover placeholder, empty category message, search no-results, loading skeletons. |
| 7.3 | Production config | Vite build → Express serves `client/dist/`. PM2 process config. `.env.production`. |

---

## State Management Plan

**Principle:** No global state library. V1 data is entirely server-derived and read-heavy.

| State Type | Strategy | Location |
|-----------|----------|----------|
| **Server data** (books, categories, chapters) | Fetch on mount per page. No client-side cache. | Component-level `useState` + `useEffect` |
| **Search query** | URL query parameter (`?q=`). Derived from URL. | React Router `useSearchParams` |
| **Pagination** | URL query parameter (`?page=`). Derived from URL. | React Router `useSearchParams` |
| **Admin JWT** | Store in memory (variable) + localStorage for persistence. | `src/services/api.js` interceptor |
| **Loading / error** | Component-local boolean states. | `useState` per component |
| **Reader current chapter** | URL param (`/books/:id/read/:chapterId`). | React Router `useParams` |

**Why no Redux/Zustand:** Every page fetches its own data. No cross-page shared state. URL is the source of truth for navigation state. Adding a state library is premature optimization.

---

## Data Flow Mapping

### Public Read Flow
```
User Action → React Router (URL change)
  → Page Component mounts
  → useEffect calls API service function
  → Axios GET → Express route → Controller → Prisma query → PostgreSQL
  → JSON response ← Controller ← Express
  → setState(data) → Component re-renders
```

### Search Flow
```
User types in SearchBar → debounce 300ms
  → setSearchParams({ q: input })
  → SearchResultsPage reads useSearchParams
  → API call GET /search?q=...
  → Prisma raw full-text query → PostgreSQL tsvector match
  → JSON results → render BookCard list
```

### Admin Write Flow
```
Admin fills form → submit handler
  → API service function (POST/PUT/DELETE)
  → Axios with Authorization: Bearer <jwt> header
  → Express auth middleware verifies JWT
  → Controller validates input (express-validator)
  → Prisma mutation → PostgreSQL
  → JSON response → update local UI state or redirect
```

### Cover Image Flow
```
Admin selects file in form → FormData with image
  → POST /admin/books (multipart/form-data)
  → multer saves to /uploads/<uuid>.<ext>
  → Prisma stores relative path in books.cover_image
  → Client renders: <img src="/uploads/filename.jpg" />
  → Express.static('uploads') serves the file
```

---

## Risk Areas

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **Full-text search performance with raw Prisma queries** | Slow or incorrect search results | Write and test the raw SQL early (Phase 2.4). Validate with real seed data. Fall back to `ILIKE` if FTS setup is problematic. |
| 2 | **Large chapter content rendering** | Slow reader page, layout breaks with long HTML | Enforce chapter-level pagination (never load full book). Sanitize stored HTML to prevent XSS. Test with a 50,000-word chapter. |
| 3 | **Cover image upload handling** | File size/type attacks, disk fill | Validate file type (JPEG/PNG/WebP only) and size (max 5MB) in multer config. Generate UUID filenames to prevent path traversal. |
| 4 | **JWT secret management** | Token forgery if secret is weak/leaked | Generate a 256-bit random secret. Load from `.env` only. Never commit `.env`. |
| 5 | **Category deletion with existing books** | Orphaned books or accidental data loss | Prisma `onDelete: SetNull`. Admin UI warns before deletion. Books remain browsable as "uncategorized". |
| 6 | **CORS misconfiguration** | API inaccessible from client or opened to all origins | Whitelist `http://localhost:5173` in dev. Set explicit production origin. Never use `*` in production. |
| 7 | **Prisma migration drift** | Schema mismatch between dev and production | Always use `prisma migrate deploy` in production (not `dev`). Commit migration files. |
| 8 | **No rate limiting in V1** | Admin login brute-force | Acceptable risk for V1 (single admin, private URL). Add `express-rate-limit` on `/admin/login` if exposed publicly. |

---

## Backend Wiring Order (Exact File Creation Sequence)

```
server/
│
├── 1.  .env
├── 2.  .gitignore
├── 3.  package.json                  (add deps + scripts)
│
├── prisma/
│   ├── 4.  schema.prisma            (4 models, relations, indexes)
│   └── 5.  seed.js                  (categories, books, chapters, admin)
│
├── src/
│   ├── 6.  index.js                 (Express app entry — helmet, cors, json, routes, error handler)
│   │
│   ├── middleware/
│   │   ├── 7.  errorHandler.js      (centralized error middleware)
│   │   ├── 8.  auth.js              (JWT verification middleware)
│   │   └── 9.  validate.js          (express-validator runner)
│   │
│   ├── routes/
│   │   ├── 10. categories.js        (GET /, GET /:id/books)
│   │   ├── 11. books.js             (GET /, GET /:id)
│   │   ├── 12. chapters.js          (GET /books/:id/chapters, GET .../chapters/:chapterId)
│   │   ├── 13. search.js            (GET /search?q=)
│   │   └── admin/
│   │       ├── 14. auth.js          (POST /admin/login)
│   │       ├── 15. categories.js    (POST, PUT, DELETE)
│   │       ├── 16. books.js         (POST, PUT, DELETE + multer)
│   │       └── 17. chapters.js      (POST, PUT, DELETE)
│   │
│   └── lib/
│       └── 18. prisma.js            (shared Prisma client instance)
│
└── uploads/                          (gitignored, created at runtime)
```

**The numbers represent strict creation order.** Each file can be immediately tested before moving to the next.

---

## Checkpoint Verification Plan

| After Phase | Verify |
|-------------|--------|
| Phase 1 | `GET /` returns `{ status: "ok" }`. Prisma Studio shows seeded data. |
| Phase 2 | All 7 public GET endpoints return correct paginated JSON via curl. |
| Phase 3 | Admin login returns JWT. CRUD operations work with JWT header. Rejected without. |
| Phase 4 | Vite dev server loads. All routes render placeholder. API calls log data. |
| Phase 5 | User can browse homepage → category → book → reader. Search returns results. |
| Phase 6 | Admin can login, create category, add book with cover, write chapters. |
| Phase 7 | `npm run build` produces static client. Production Express serves everything. |

---

*This roadmap is sequenced for zero guesswork. Each step has clear inputs, outputs, and validation criteria. Build in order. Verify at each checkpoint. Do not skip ahead.*
