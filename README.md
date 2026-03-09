# BookShell

A clean, distraction-free web app for browsing and reading books online. Built with a modern React frontend and a Node.js/Express backend, BookShell provides a simple, focused reading experience with easy discovery by category, search, and admin management.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Browse books by category with pagination
- Full-text search by title or author
- Read books in a clean, mobile-friendly reader
- Admin dashboard for managing books, categories, and chapters
- JWT-based admin authentication
- RESTful API with PostgreSQL database

---

## Tech Stack
- **Frontend:** React 18, Vite, React Router, CSS Modules
- **Backend:** Node.js, Express, Drizzle ORM
- **Database:** PostgreSQL
- **Other:** JWT, Helmet, Multer, dotenv

---

## Folder Structure
```
BookShell/
├── client/         # React SPA frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── ...
├── server/         # Node.js/Express backend
│   ├── src/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   │   └── admin/
│   │   └── ...
│   └── drizzle.config.js
├── PRD.md          # Product Requirements
├── TRD.md          # Technical Requirements
├── ROADMAP.md      # Implementation Roadmap
└── ...
```

---

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm
- PostgreSQL (local or cloud instance)

### 1. Clone the repository
```sh
git clone https://github.com/yourusername/BookShell.git
cd BookShell
```

### 2. Install dependencies
#### Backend
```sh
cd server
npm install
```
#### Frontend
```sh
cd ../client
npm install
```

### 3. Configure environment variables
- Copy `.env.example` to `.env` in the `server/` folder and fill in your PostgreSQL connection string and other secrets.

### 4. Database setup
From the `server/` directory:
```sh
npm run db:generate   # Generate Drizzle ORM client
npm run db:migrate    # Run migrations
npm run seed          # Seed the database with sample data
```

### 5. Run the app
#### Backend (from `server/`):
```sh
npm run dev
```
#### Frontend (from `client/`):
```sh
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001 (default)

---

## Usage
- Visit the frontend URL to browse, search, and read books.
- Admins can log in at `/admin/login` to manage content.

---

## API Overview
- RESTful endpoints for books, categories, chapters, search, and admin actions.
- See `server/src/routes/` for route details.
- Example endpoints:
  - `GET /categories` — List categories
  - `GET /books` — List books
  - `GET /books/:id` — Book details
  - `GET /books/:id/read/:chapterId` — Chapter content
  - `POST /admin/login` — Admin login
  - `POST /admin/books` — Add a book (admin)

---

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

---

## License
[MIT](LICENSE)
