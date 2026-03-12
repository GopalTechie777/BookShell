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
- User signup with email OTP verification
- User login with email or username
- RESTful API with PostgreSQL database

---

## Tech Stack
- **Frontend:** React 18, Vite, React Router, CSS Modules
- **Backend:** Node.js, Express, Drizzle ORM
- **Database:** PostgreSQL
- **Other:** JWT, Helmet, Multer, Nodemailer, dotenv

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
- Copy `.env.example` to `.env` in the `server/` folder and fill in your PostgreSQL connection string and secrets.
- **Never commit your `.env` file!**

Minimum SMTP variables for OTP signup (Gmail example):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=BookShell <your_email@gmail.com>
EMAIL_FROM=your_email@gmail.com
```

### 4. Database setup
From the `server/` directory:
```sh
npm run db:push    # Push Drizzle schema to your database
npm run seed       # (Optional) Seed the database with sample data
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
- Backend API: http://localhost:3000 (default)

---

## Usage
- Visit the frontend URL to browse, search, and read books.
- Sign up with email OTP, then log in with email or username.
- Admins can log in at `/admin/login` to manage content and import books from Project Gutenberg.

---

## API Overview
- RESTful endpoints for books, categories, chapters, search, user and admin actions.
- Project Gutenberg search: `GET /api/v1/gutenberg/search?q=...`
- User auth: `POST /api/v1/auth/signup/request-otp`, `POST /api/v1/auth/signup/verify`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- Admin Gutenberg import: `POST /api/v1/admin/gutenberg/import`, `PUT /api/v1/admin/gutenberg/reimport`
- See `server/src/routes/` for full details.

---

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

---

## License
[MIT](LICENSE)
