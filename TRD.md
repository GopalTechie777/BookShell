# Technical Requirements Document (TRD) — BookReading

---

## 1. System Architecture Overview

**Pattern:** Monolithic client-server architecture with REST API.

┌─────────────┐ HTTPS ┌─────────────────┐ ┌──────────────┐
│ Client │ ◄────────────────► │ Server (API) │ ◄───► │ PostgreSQL │
│ (React SPA)│ REST / JSON │ Node + Express│ │ Database │
└─────────────┘ └─────────────────┘ └──────────────┘
│
▼
┌─────────────────┐
│ Static Assets │
│ (Cover Images) │
└─────────────────┘


- **Client:** React Single-Page Application (SPA) served as static files.
- **Server:** Node.js + Express API handling business logic and data access.
- **Database:** PostgreSQL (relational, supports full-text search natively).
- **No microservices, message queues, or caching layer in V1.** Add only when bottlenecks are measured.

---

## 2. Frontend Responsibilities (`client/`)

**Stack:** React 18, React Router, CSS Modules (or Tailwind CSS)

| Responsibility      | Detail                                                                 |
|---------------------|-----------------------------------------------------------------------|
| Routing             | Client-side routing via React Router (homepage, category, book, reader, search, admin). |
| API Consumption     | Fetch data from backend REST API. All state is server-derived.         |
| Book Rendering      | Render chapter HTML/Markdown content in a clean reader layout.         |
| Search UI           | Debounced search input; calls backend search endpoint.                |
| Pagination          | Paginated book listings; pass `page` and `limit` query params to API.  |
| Responsive Layout   | Mobile-first CSS. No separate mobile app.                             |
| Admin Pages         | Simple forms for managing books and categories (behind admin login).  |
| Error/Empty States  | Handle no results, loading, missing content, placeholder covers.       |

**Not Responsible For:**
- Authentication logic (stores/sends token only).
- Data validation (server validates).
- Book content parsing (server normalizes on ingest).

---

## 3. Backend Responsibilities (`server/`)

**Stack:** Node.js, Express, Prisma ORM, PostgreSQL

| Responsibility      | Detail                                                                 |
|---------------------|-----------------------------------------------------------------------|
| REST API            | Serve all endpoints (books, categories, chapters, search, admin).     |
| Input Validation    | Validate and sanitize all incoming request data (express-validator). |
| Database Access     | All reads/writes through Prisma ORM. No raw SQL except full-text search. |
| Admin Authentication| JWT-based auth for admin routes only. No reader auth.                 |
| Pagination          | Server-side pagination on all list endpoints.                         |
| Search              | PostgreSQL full-text search on book title and author fields.           |
| Static File Serving | Serve uploaded cover images from a local `/uploads` directory.        |
| Error Handling      | Centralized error middleware; consistent JSON error responses.       |
| Seeding             | Database seed script to populate initial books and categories.        |

---

## 4. Database Schema Proposal

### Tables

#### `categories`
| Column       | Type           | Constraints                     |
|--------------|----------------|----------------------------------|
| id           | UUID           | PK, default `gen_random_uuid()`  |
| name         | VARCHAR(100)   | NOT NULL, UNIQUE                 |
| description  | TEXT           | NULLABLE                        |
| created_at   | TIMESTAMP      | DEFAULT `now()`                  |
| updated_at   | TIMESTAMP      | DEFAULT `now()`                  |

#### `books`
| Column        | Type           | Constraints                          |
|---------------|----------------|--------------------------------------|
| id            | UUID           | PK, default `gen_random_uuid()`       |
| title         | VARCHAR(255)   | NOT NULL                             |
| author        | VARCHAR(255)   | NOT NULL                             |
| description   | TEXT           | NULLABLE                             |
| cover_image   | VARCHAR(500)   | NULLABLE (path to uploaded file)     |
| is_featured   | BOOLEAN        | DEFAULT `false`                      |
| category_id   | UUID           | FK → `categories.id`, NULLABLE (SET NULL on delete) |
| created_at    | TIMESTAMP      | DEFAULT `now()`                      |
| updated_at    | TIMESTAMP      | DEFAULT `now()`                      |

**Index:** GIN index on `tsvector(title || ' ' || author)` for full-text search.

#### `chapters`
| Column       | Type           | Constraints                          |
|--------------|----------------|--------------------------------------|
| id           | UUID           | PK, default `gen_random_uuid()`       |
| book_id      | UUID           | FK → `books.id`, CASCADE on delete    |
| title        | VARCHAR(255)   | NOT NULL                             |
| content      | TEXT           | NOT NULL (HTML or Markdown)          |
| order        | INTEGER        | NOT NULL                             |
| created_at   | TIMESTAMP      | DEFAULT `now()`                      |
| updated_at   | TIMESTAMP      | DEFAULT `now()`                      |

**Index:** Unique compound index on `(book_id, order)`.

#### `admins`
| Column        | Type           | Constraints                         |
|---------------|----------------|--------------------------------------|
| id            | UUID           | PK, default `gen_random_uuid()`      |
| username      | VARCHAR(100)   | NOT NULL, UNIQUE                     |
| password_hash | VARCHAR(255)   | NOT NULL (bcrypt)                    |
| created_at    | TIMESTAMP      | DEFAULT `now()`                      |

### Relationships
- `categories` 1 → * `books`
- `books` 1 → * `chapters`
- Chapters cascade-delete when a book is removed.

---

## 5. API Structure

**Base URL:** `/api/v1`

### Public Endpoints (No Auth)
| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/books`                          | List books (paginated). Query: `page`, `limit`, `featured`. |
| GET    | `/books/:id`                      | Get single book detail.                  |
| GET    | `/books/:id/chapters`             | List chapters for a book (id, title, order — no content). |
| GET    | `/books/:id/chapters/:chapterId`  | Get single chapter with full content.    |
| GET    | `/categories`                     | List all categories.                     |
| GET    | `/categories/:id/books`           | List books in a category (paginated).    |
| GET    | `/search?q=`                      | Search books by title/author.            |

### Admin Endpoints (JWT Required)
| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/admin/login`                    | Authenticate admin, return JWT.          |
| POST   | `/admin/books`                    | Create a book.                           |
| PUT    | `/admin/books/:id`                | Update a book.                           |
| DELETE | `/admin/books/:id`                | Delete a book and its chapters.          |
| POST   | `/admin/books/:id/chapters`       | Add a chapter to a book.                 |
| PUT    | `/admin/chapters/:id`             | Update a chapter.                        |
| DELETE | `/admin/chapters/:id`             | Delete a chapter.                        |
| POST   | `/admin/categories`               | Create a category.                       |
| PUT    | `/admin/categories/:id`           | Update a category.                       |
| DELETE | `/admin/categories/:id`           | Delete a category (books set to uncategorized). |

### Response Format
```json
// Success (list)
{ "data": [...], "page": 1, "limit": 20, "total": 57 }

// Success (single)
{ "data": { ... } }

// Error
{ "error": { "message": "Not found", "status": 404 } }

6. Authentication Strategy


  
    
      Concern
      Approach
    
  
  
    
      Reader Auth
      None. All public endpoints are unauthenticated.
    
    
      Admin Auth
      JWT (JSON Web Token), stateless.
    
    
      Password Storage
      bcrypt with cost factor 12.
    
    
      Token Lifetime
      24 hours. No refresh tokens in V1.
    
    
      Token Transport
      Authorization: Bearer  header.
    
    
      Admin Provisioning
      Seed script creates initial admin. No self-registration.
    
    
      Route Protection
      Express middleware checks JWT on all /admin/* routes.
    
  


Here is the content structured as a single .md file. You can copy this into a file named TRD.md:
markdown
Copy

# Technical Requirements Document (TRD) — BookReading

---

## 1. System Architecture Overview

**Pattern:** Monolithic client-server architecture with REST API.

┌─────────────┐    HTTPS    ┌─────────────────┐    ┌──────────────┐

│  Client     │ ◄─────────► │    Server       │ ◄───► │ PostgreSQL   │

│ (React SPA) │             │ (Node + Express)│      │  Database    │

└─────────────┘             └─────────────────┘      └──────────────┘

│

▼

┌─────────────────┐

│ Static Assets    │

│ (Cover Images)   │

└─────────────────┘
Copy

- **Client:** React Single-Page Application (SPA) served as static files.
- **Server:** Node.js + Express API handling business logic and data access.
- **Database:** PostgreSQL (relational, supports full-text search natively).
- **No microservices, message queues, or caching layer in V1.** Add only when bottlenecks are measured.

---

## 2. Frontend Responsibilities (`client/`)

**Stack:** React 18, React Router, CSS Modules (or Tailwind CSS)

| Responsibility      | Detail                                                                 |
|---------------------|-----------------------------------------------------------------------|
| Routing             | Client-side routing via React Router (homepage, category, book, reader, search, admin). |
| API Consumption     | Fetch data from backend REST API. All state is server-derived.         |
| Book Rendering      | Render chapter HTML/Markdown content in a clean reader layout.         |
| Search UI           | Debounced search input; calls backend search endpoint.                |
| Pagination          | Paginated book listings; pass `page` and `limit` query params to API.  |
| Responsive Layout   | Mobile-first CSS. No separate mobile app.                             |
| Admin Pages         | Simple forms for managing books and categories (behind admin login).  |
| Error/Empty States  | Handle no results, loading, missing content, placeholder covers.       |

**Not Responsible For:**
- Authentication logic (stores/sends token only).
- Data validation (server validates).
- Book content parsing (server normalizes on ingest).

---

## 3. Backend Responsibilities (`server/`)

**Stack:** Node.js, Express, Prisma ORM, PostgreSQL

| Responsibility      | Detail                                                                 |
|---------------------|-----------------------------------------------------------------------|
| REST API            | Serve all endpoints (books, categories, chapters, search, admin).     |
| Input Validation    | Validate and sanitize all incoming request data (express-validator). |
| Database Access     | All reads/writes through Prisma ORM. No raw SQL except full-text search. |
| Admin Authentication| JWT-based auth for admin routes only. No reader auth.                 |
| Pagination          | Server-side pagination on all list endpoints.                         |
| Search              | PostgreSQL full-text search on book title and author fields.           |
| Static File Serving | Serve uploaded cover images from a local `/uploads` directory.        |
| Error Handling      | Centralized error middleware; consistent JSON error responses.       |
| Seeding             | Database seed script to populate initial books and categories.        |

---

## 4. Database Schema Proposal

### Tables

#### `categories`
| Column       | Type           | Constraints                     |
|--------------|----------------|----------------------------------|
| id           | UUID           | PK, default `gen_random_uuid()`  |
| name         | VARCHAR(100)   | NOT NULL, UNIQUE                 |
| description  | TEXT           | NULLABLE                        |
| created_at   | TIMESTAMP      | DEFAULT `now()`                  |
| updated_at   | TIMESTAMP      | DEFAULT `now()`                  |

#### `books`
| Column        | Type           | Constraints                          |
|---------------|----------------|--------------------------------------|
| id            | UUID           | PK, default `gen_random_uuid()`       |
| title         | VARCHAR(255)   | NOT NULL                             |
| author        | VARCHAR(255)   | NOT NULL                             |
| description   | TEXT           | NULLABLE                             |
| cover_image   | VARCHAR(500)   | NULLABLE (path to uploaded file)     |
| is_featured   | BOOLEAN        | DEFAULT `false`                      |
| category_id   | UUID           | FK → `categories.id`, NULLABLE (SET NULL on delete) |
| created_at    | TIMESTAMP      | DEFAULT `now()`                      |
| updated_at    | TIMESTAMP      | DEFAULT `now()`                      |

**Index:** GIN index on `tsvector(title || ' ' || author)` for full-text search.

#### `chapters`
| Column       | Type           | Constraints                          |
|--------------|----------------|--------------------------------------|
| id           | UUID           | PK, default `gen_random_uuid()`       |
| book_id      | UUID           | FK → `books.id`, CASCADE on delete    |
| title        | VARCHAR(255)   | NOT NULL                             |
| content      | TEXT           | NOT NULL (HTML or Markdown)          |
| order        | INTEGER        | NOT NULL                             |
| created_at   | TIMESTAMP      | DEFAULT `now()`                      |
| updated_at   | TIMESTAMP      | DEFAULT `now()`                      |

**Index:** Unique compound index on `(book_id, order)`.

#### `admins`
| Column        | Type           | Constraints                         |
|---------------|----------------|--------------------------------------|
| id            | UUID           | PK, default `gen_random_uuid()`      |
| username      | VARCHAR(100)   | NOT NULL, UNIQUE                     |
| password_hash | VARCHAR(255)   | NOT NULL (bcrypt)                    |
| created_at    | TIMESTAMP      | DEFAULT `now()`                      |

### Relationships
- `categories` 1 → * `books`
- `books` 1 → * `chapters`
- Chapters cascade-delete when a book is removed.

---

## 5. API Structure

**Base URL:** `/api/v1`

### Public Endpoints (No Auth)
| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/books`                          | List books (paginated). Query: `page`, `limit`, `featured`. |
| GET    | `/books/:id`                      | Get single book detail.                  |
| GET    | `/books/:id/chapters`             | List chapters for a book (id, title, order — no content). |
| GET    | `/books/:id/chapters/:chapterId`  | Get single chapter with full content.    |
| GET    | `/categories`                     | List all categories.                     |
| GET    | `/categories/:id/books`           | List books in a category (paginated).    |
| GET    | `/search?q=`                      | Search books by title/author.            |

### Admin Endpoints (JWT Required)
| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/admin/login`                    | Authenticate admin, return JWT.          |
| POST   | `/admin/books`                    | Create a book.                           |
| PUT    | `/admin/books/:id`                | Update a book.                           |
| DELETE | `/admin/books/:id`                | Delete a book and its chapters.          |
| POST   | `/admin/books/:id/chapters`       | Add a chapter to a book.                 |
| PUT    | `/admin/chapters/:id`             | Update a chapter.                        |
| DELETE | `/admin/chapters/:id`             | Delete a chapter.                        |
| POST   | `/admin/categories`               | Create a category.                       |
| PUT    | `/admin/categories/:id`           | Update a category.                       |
| DELETE | `/admin/categories/:id`           | Delete a category (books set to uncategorized). |

### Response Format
```json
// Success (list)
{ "data": [...], "page": 1, "limit": 20, "total": 57 }

// Success (single)
{ "data": { ... } }

// Error
{ "error": { "message": "Not found", "status": 404 } }


6. Authentication Strategy


  
    
      Concern
      Approach
    
  
  
    
      Reader Auth
      None. All public endpoints are unauthenticated.
    
    
      Admin Auth
      JWT (JSON Web Token), stateless.
    
    
      Password Storage
      bcrypt with cost factor 12.
    
    
      Token Lifetime
      24 hours. No refresh tokens in V1.
    
    
      Token Transport
      Authorization: Bearer  header.
    
    
      Admin Provisioning
      Seed script creates initial admin. No self-registration.
    
    
      Route Protection
      Express middleware checks JWT on all /admin/* routes.
    
  


Why JWT: Stateless, no session store needed, simple to implement, sufficient for single-admin V1.

7. Third-Party Dependencies
Server


  
    
      Package
      Purpose
      Why This One
    
  
  
    
      express
      HTTP framework
      Industry standard, minimal, stable.
    
    
      prisma
      ORM & migrations
      Type-safe queries, excellent migration system.
    
    
      bcrypt
      Password hashing
      Battle-tested, secure defaults.
    
    
      jsonwebtoken
      JWT creation/verification
      De facto standard for JWT in Node.
    
    
      express-validator
      Input validation & sanitization
      Integrates with Express, prevents injection.
    
    
      multer
      File upload handling (covers)
      Standard multipart handling for Express.
    
    
      cors
      Cross-origin requests
      Required for separate client/server dev.
    
    
      dotenv
      Environment variable loading
      Keep secrets out of code.
    
    
      helmet
      Security headers
      Sensible HTTP header defaults.
    
  


Client


  
    
      Package
      Purpose
    
  
  
    
      react
      UI framework
    
    
      react-router-dom
      Client-side routing
    
    
      axios/fetch
      HTTP client
    
  


Dev Dependencies


  
    
      Package
      Purpose
    
  
  
    
      nodemon
      Auto-restart server on changes.
    
    
      vite
      Client dev server and build tool.
    
  


No ORMs, caching libraries, or infrastructure tools beyond what's listed. Add only when a real need arises.

8. Scalability Considerations
V1 — Appropriate for Launch


  
    
      Area
      Approach
    
  
  
    
      Database
      Single PostgreSQL instance. Indexes on search fields and foreign keys.
    
    
      Content Size
      Chapters stored as TEXT in DB. Loaded one at a time — no full-book loads.
    
    
      Pagination
      All list endpoints paginated server-side (default 20, max 100).
    
    
      Static Assets
      Cover images served from local /uploads directory.
    
    
      Deployment
      Single server process. PM2 or systemd for process management.
    
  


When Growth Demands It (Post-V1)


  
    
      Trigger
      Action
    
  
  
    
      Cover images > 10GB
      Move to S3/Cloudflare R2 for object storage.
    
    
      DB queries slow (>200ms p95)
      Add Redis caching for category lists and featured books.
    
    
      Search gets complex
      Evaluate Elasticsearch/Meilisearch — only if PG FTS is insufficient.
    
    
      Traffic > 1 server handles
      Containerize (Docker), deploy behind load balancer.
    
    
      Admin team grows
      Add role-based access control to admin endpoints.
    
    
      Need CDN
      Put Cloudflare or similar in front of static assets.
    
  


What We Deliberately Avoid in V1

No Redis, Elasticsearch, or message queues.
No Docker/Kubernetes — deploy directly.
No CDN — local static serving is fine at low scale.
No database replication — single instance is sufficient.
No server-side rendering — SPA with client-side routing.

9. Project Structure
Copy

bookreading/
├── PRD.md
├── TRD.md
├── client/                     # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # API call functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Seed data
│   ├── src/
│   │   ├── routes/             # Route handlers
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── controllers/        # Request/response logic
│   │   └── index.js            # Express app entry point
│   ├── uploads/                # Cover images (gitignored)
│   ├── .env                    # Environment variables (gitignored)
│   └── package.json
└── .gitignore


10. Environment Variables
Server (.env)
env
Copy

DATABASE_URL=postgresql://user\:password@localhost:5432/bookreading
JWT_SECRET=<random-256-bit-key>
PORT=3000
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<initial-password-for-seed>

Copy

You can save this content directly into a file named `TRD.md`.

