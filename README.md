<p align="center">
  <img src="https://img.shields.io/badge/SplitSense-Expense%20Tracker-blueviolet?style=for-the-badge&logo=cashapp&logoColor=white" alt="SplitSense Banner" />
</p>

<h1 align="center">💰 SplitSense — Smart Expense Tracker & Bill Splitter</h1>

<p align="center">
  A full-stack expense management application with real-time bill splitting, settlement tracking, and an admin dashboard — built with the MERN stack.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</p>

---

## 📋 Table of Contents

- **🧭 About** — [Overview](#-overview) · [Key Features](#-key-features) · [Tech Stack](#️-tech-stack)
- **🏛️ Design** — [Architecture](#️-architecture) · [Project Structure](#-project-structure) · [Database Schema](#️-database-schema) · [API Reference](#-api-reference)
- **🚀 Setup** — [Prerequisites](#prerequisites) · [Installation](#installation) · [Environment Config](#environment-configuration) · [Run the App](#running-the-application) · [Admin Setup](#setting-up-admin-access)
- **📌 More** — [Security](#-security-1) · [Contributing](#-contributing) · [License](#-license)

---

## 🔍 Overview

**SplitSense** is a production-grade, multi-user expense tracking and bill-splitting application. Whether you're managing personal finances or splitting costs with friends and roommates, SplitSense provides a clean, intuitive interface backed by a secure, well-architected REST API.

Users can track personal expenses, create shared expenses with equal or custom splits, settle debts, and view real-time balance summaries — all protected behind JWT-based authentication with automatic token refresh.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **🔐 Authentication** | JWT access + refresh token flow with secure httpOnly cookie support |
| **📊 Dashboard** | Real-time summary with charts (category breakdown, monthly trends via Recharts) |
| **💳 Expense Management** | Full CRUD for personal expenses with category tagging and date filtering |
| **💰 Income Tracking** | Full CRUD for income sources with categories to calculate net savings |
| **👥 Bill Splitting** | Share expenses with other users using **equal** or **custom** split modes |
| **⚖️ Balance Tracker** | View who owes you and who you owe — with one-click settlement |
| **🔔 Notifications** | In-app notifications when someone shares an expense with you |
| **🛡️ Admin Panel** | User management dashboard with time-based metrics (weekly, monthly, yearly signups) |
| **🔒 Security Hardened** | Helmet, CORS, rate limiting, NoSQL injection sanitization, input validation |
| **📱 Responsive UI** | Modern, mobile-friendly interface with smooth animations |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library with functional components & hooks |
| **React Router v6** | Client-side routing with protected & role-based routes |
| **Axios** | HTTP client with interceptors for token refresh |
| **Recharts** | Data visualization (pie charts, bar charts) |
| **React Toastify** | Toast notifications for user feedback |
| **CSS3** | Custom styling with modern design patterns |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js 4** | REST API framework |
| **MongoDB** | NoSQL document database |
| **Mongoose 8** | MongoDB ODM with schema validation |
| **JSON Web Tokens** | Stateless authentication (access + refresh tokens) |
| **bcrypt.js** | Password hashing with configurable salt rounds |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Brute-force protection on login endpoint |
| **express-mongo-sanitize** | NoSQL injection prevention |
| **express-validator** | Request body validation |
| **Nodemon** | Hot-reload during development |

---

## 🏗️ Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                          │
│                                                                     │
│   React 18 SPA ─── React Router v6 ─── Axios HTTP Client           │
│       │                                       │                     │
│   AuthContext ◄──── Token Management ────► localStorage             │
│   ExpenseContext         (Access + Refresh)                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP (REST API)
                              │ Port 3000 → Port 5000
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                            │
│                                                                     │
│   Helmet ── CORS ── JSON Parser ── Cookie Parser ── Mongo Sanitize  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MIDDLEWARE LAYER                              │
│                                                                     │
│   Auth Middleware ── Role Middleware ── Rate Limiter ── Validator    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ROUTE LAYER                                 │
│                                                                     │
│   /api/auth ── /api/expenses ── /api/settlements ── /api/admin      │
│                                  /api/notifications                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER                              │
│                                                                     │
│   authController ── expenseController ── settlementController       │
│   adminController ── notificationController                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MODEL LAYER                                 │
│                                                                     │
│   User ── Expense ── Settlement ── Notification ── RefreshToken     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     MongoDB (Database)                               │
│                                                                     │
│   Collections: users, expenses, settlements, notifications,         │
│                refreshtokens                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Request
    │
    ▼
[ Helmet + CORS + Body Parser + Mongo Sanitize ]
    │
    ▼
[ Auth Middleware ] ──── Verify JWT ──── Attach req.user
    │
    ▼
[ Role Middleware ] ──── Check user.role (if admin route)
    │
    ▼
[ Rate Limiter ] ──── Throttle failed login attempts (5/15min)
    │
    ▼
[ express-validator ] ──── Validate & sanitize request body
    │
    ▼
[ Controller ] ──── Business logic + DB operations
    │
    ▼
[ Standardized API Response ] ──── { success, data, message }
```

---

## 📁 Project Structure

```
SplitSense/
├── backend/                          # Express.js REST API
│   ├── controllers/
│   │   ├── adminController.js        # Admin dashboard & user management
│   │   ├── authController.js         # Register, login, logout, refresh
│   │   ├── expenseController.js      # CRUD + shared expenses + balances
│   │   ├── incomeController.js       # Income CRUD & summary
│   │   ├── notificationController.js # In-app notification management
│   │   └── settlementController.js   # Debt settlement processing
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT verification & user injection
│   │   ├── errorHandler.js           # Centralized error handling
│   │   ├── roleMiddleware.js         # Role-based access control
│   │   └── validateRequest.js        # express-validator integration
│   ├── models/
│   │   ├── Expense.js                # Expense schema with split details
│   │   ├── Income.js                 # Income schema
│   │   ├── Notification.js           # Notification schema
│   │   ├── RefreshToken.js           # Refresh token persistence
│   │   ├── Settlement.js             # Settlement records
│   │   └── User.js                   # User schema with role support
│   ├── routes/
│   │   ├── adminRoutes.js            # GET /api/admin/*
│   │   ├── authRoutes.js             # POST /api/auth/*
│   │   ├── expenseRoutes.js          # CRUD /api/expenses/*
│   │   ├── incomeRoutes.js           # CRUD /api/income/*
│   │   ├── notificationRoutes.js     # GET /api/notifications/*
│   │   └── settlementRoutes.js       # POST /api/settlements/*
│   ├── scripts/
│   │   ├── set-admin.js              # Quick admin seed (hardcoded creds)
│   │   └── create-admin.js           # CLI tool to create/promote admins
│   ├── utils/
│   │   ├── apiResponse.js            # Standardized response helpers
│   │   ├── constants.js              # Expense categories & limits
│   │   ├── roundCurrency.js          # Cent-based rounding utilities
│   │   ├── splitCalculator.js        # Equal & custom split algorithms
│   │   └── token.js                  # JWT generation helpers
│   ├── .env.example                  # Environment variable template
│   ├── package.json
│   └── server.js                     # Express app entry point
│
├── frontend/                         # React 18 SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmptyState.js         # Empty data placeholder
│   │   │   ├── ErrorBoundary.js      # React error boundary
│   │   │   ├── LoadingSpinner.js     # Loading indicator
│   │   │   ├── Navbar.js             # Navigation with auth-aware links
│   │   │   ├── ProtectedRoute.js     # Auth guard for routes
│   │   │   └── RoleRoute.js          # Role-based route guard
│   │   ├── context/
│   │   │   ├── AuthContext.js        # Authentication state management
│   │   │   ├── ExpenseContext.js     # Expense data state management
│   │   │   └── IncomeContext.js      # Income data state management
│   │   ├── pages/
│   │   │   ├── AdminPage.js          # Admin dashboard with metrics
│   │   │   ├── BalancesPage.js       # Who owes whom + settlements
│   │   │   ├── DashboardPage.js      # Summary charts & stats
│   │   │   ├── EditExpensePage.js    # Edit existing expense
│   │   │   ├── EditIncomePage.js     # Edit existing income
│   │   │   ├── ExpenseDetailPage.js  # Single expense view
│   │   │   ├── ExpensesPage.js       # Expense list with filters
│   │   │   ├── IncomePage.js         # Income list with filters
│   │   │   ├── LoginPage.js          # User login form
│   │   │   ├── NewExpensePage.js     # Create expense form
│   │   │   ├── NewIncomePage.js      # Create income form
│   │   │   ├── RegisterPage.js       # User registration form
│   │   │   └── SharedPage.js         # Shared expenses view
│   │   ├── services/
│   │   │   ├── adminService.js       # Admin API calls
│   │   │   ├── api.js                # Axios instance with interceptors
│   │   │   ├── authService.js        # Auth API calls
│   │   │   ├── expenseService.js     # Expense API calls
│   │   │   ├── incomeService.js      # Income API calls
│   │   │   └── notificationService.js# Notification API calls
│   │   ├── utils/
│   │   │   └── format.js            # Currency & date formatters
│   │   ├── App.js                    # Root component with routing
│   │   ├── index.js                  # React DOM entry point
│   │   └── styles.css                # Global stylesheet
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

```
┌──────────────────┐       ┌────────────────────┐       ┌──────────────────┐
│      User        │       │      Expense        │       │   Settlement     │
├──────────────────┤       ├────────────────────┤       ├──────────────────┤
│ _id: ObjectId    │◄──┐   │ _id: ObjectId      │   ┌──►│ _id: ObjectId    │
│ name: String     │   │   │ owner: ObjectId ───┼───┘   │ expenseId: Ref   │
│ email: String    │   │   │ title: String      │       │ settledBy: Ref   │
│ passwordHash: *  │   ├───┤ amount: Number     │       │ settledTo: Ref   │
│ role: enum       │   │   │ category: enum     │       │ amount: Number   │
│ createdAt: Date  │   │   │ date: Date         │       │ settledAt: Date  │
│ updatedAt: Date  │   │   │ description: String│       └──────────────────┘
└──────────────────┘   │   │ isShared: Boolean  │
                       │   │ splitDetails: [    │       ┌──────────────────┐
                       │   │   { owedBy: Ref,   │       │  Notification    │
                       │   │     amountOwed,    │       ├──────────────────┤
                       │   │     isSettled,     │       │ _id: ObjectId    │
                       │   │     settledAt,     │       │ recipient: Ref   │
                       │   │     isCancelled,   │       │ sender: Ref      │
                       │   │     cancelledAt }  │       │ expense: Ref     │
                       │   │ ]                  │       │ type: enum       │
                       │   │ isDeleted: Boolean │       │ title: String    │
                       │   │ deletedAt: Date    │       │ message: String  │
                       │   │ createdAt: Date    │       │ isRead: Boolean  │
                       │   │ updatedAt: Date    │       │ readAt: Date     │
                       │   └────────────────────┘       │ createdAt: Date  │
                       │                                └──────────────────┘
                       │   ┌────────────────────┐       ┌──────────────────┐
                       │   │   RefreshToken      │       │      Income      │
                       │   ├────────────────────┤       ├──────────────────┤
                       └───┤ userId: Ref        │       │ _id: ObjectId    │
                           │ token: String      │       │ owner: Ref       │
                           │ expiresAt: Date    │       │ title: String    │
                           └────────────────────┘       │ amount: Number   │
                                                        │ category: enum   │
                                                        │ date: Date       │
                                                        │ isDeleted: Bool  │
                                                        └──────────────────┘
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create a new user account | ❌ |
| `POST` | `/api/auth/login` | Login and receive tokens | ❌ |
| `POST` | `/api/auth/logout` | Revoke refresh token | ❌ |
| `POST` | `/api/auth/refresh` | Get new access token | ❌ |

### Expenses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/expenses` | List all personal expenses | ✅ |
| `POST` | `/api/expenses` | Create a personal expense | ✅ |
| `GET` | `/api/expenses/summary` | Get dashboard summary | ✅ |
| `GET` | `/api/expenses/:id` | Get expense details | ✅ |
| `PUT` | `/api/expenses/:id` | Update an expense | ✅ |
| `DELETE` | `/api/expenses/:id` | Soft-delete an expense | ✅ |

### Income

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/income` | List all personal incomes | ✅ |
| `POST` | `/api/income` | Create a personal income | ✅ |
| `GET` | `/api/income/summary` | Get income summary | ✅ |
| `GET` | `/api/income/:id` | Get income details | ✅ |
| `PUT` | `/api/income/:id` | Update an income | ✅ |
| `DELETE` | `/api/income/:id` | Soft-delete an income | ✅ |

### Shared Expenses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/expenses/shared` | Create a shared expense | ✅ |
| `GET` | `/api/expenses/shared/owed-to-me` | Debts others owe you | ✅ |
| `GET` | `/api/expenses/shared/i-owe` | Debts you owe others | ✅ |
| `GET` | `/api/expenses/balances` | Net balance summary | ✅ |

### Settlements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/settlements` | Settle a shared expense debt | ✅ |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/notifications` | Get user notifications | ✅ |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/users` | List all users with metrics | 🔑 Admin |
| `DELETE` | `/api/admin/users/:id` | Delete a user | 🔑 Admin |

### Health Check

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | API liveness probe | ❌ |

---

## 🚀 Getting Started

Follow these steps carefully to run SplitSense on your local machine.

### Prerequisites

Make sure you have the following installed on your system **before proceeding**:

| Tool | Minimum Version | Download Link |
|---|---|---|
| **Node.js** | v18.0.0 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0 or higher | Comes with Node.js |
| **MongoDB** | v6.0 or higher | [mongodb.com/try/download](https://www.mongodb.com/try/download/community) |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) |

> **💡 Tip:** You can verify your installations by running:
> ```bash
> node --version    # Should print v18.x.x or higher
> npm --version     # Should print 9.x.x or higher
> mongod --version  # Should print v6.x or higher
> git --version     # Should print git version x.x.x
> ```

---

### Installation

#### Step 1 — Clone the Repository

```bash
git clone https://github.com/ParaniDharshan04/SplitSense.git
cd SplitSense
```

#### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all required packages: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `dotenv`, `express-rate-limit`, `express-mongo-sanitize`, `express-validator`, `cookie-parser`, and `nodemon`.

#### Step 3 — Install Frontend Dependencies

Open a **new terminal** (keep the backend terminal open) and run:

```bash
cd frontend
npm install
```

This will install: `react`, `react-dom`, `react-router-dom`, `axios`, `recharts`, `react-toastify`, and other React dependencies.

---

### Environment Configuration

#### Step 4 — Create the Backend `.env` File

Inside the `backend/` directory, create a `.env` file by copying the example template:

```bash
# From the backend/ directory:
cp .env.example .env
```

> **⚠️ On Windows (Command Prompt)**, use:
> ```cmd
> copy .env.example .env
> ```

> **⚠️ On Windows (PowerShell)**, use:
> ```powershell
> Copy-Item .env.example .env
> ```

Now open `backend/.env` in any text editor and configure these values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Connection String
# If MongoDB is running locally on the default port:
MONGO_URI=mongodb://127.0.0.1:27017/splitsense

# If using MongoDB Atlas (cloud), replace with your connection string:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/splitsense

# Frontend Origin (must match the port React runs on)
CLIENT_ORIGIN=http://localhost:3000

# JWT Secrets — REPLACE THESE with your own random strings!
# You can generate them using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Bcrypt Salt Rounds (higher = more secure but slower)
BCRYPT_SALT_ROUNDS=12
```

> **🔑 Generating Secure JWT Secrets:**
> 
> Run this command **twice** (once for each secret) and paste the output into your `.env`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

### Running the Application

#### Step 5 — Start MongoDB

Make sure your MongoDB server is running before starting the backend.

**On Windows:**
```bash
# If installed as a service, it may already be running.
# Otherwise, start it manually:
mongod
```

**On macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**On Linux:**
```bash
sudo systemctl start mongod
```

> **💡 Using MongoDB Atlas?** If you're using a cloud-hosted MongoDB Atlas cluster, skip this step — just make sure your `MONGO_URI` in `.env` points to your Atlas connection string and your IP is whitelisted.

#### Step 6 — Start the Backend Server

```bash
# From the backend/ directory:
npm run dev
```

You should see:
```
Server running on port 5000 (development)
```

> This starts the server with **nodemon** for automatic hot-reloading during development.

#### Step 7 — Start the Frontend Development Server

In a **separate terminal**:

```bash
# From the frontend/ directory:
npm start
```

You should see:
```
Compiled successfully!

Local: http://localhost:3000
```

The React app will automatically open in your default browser at `http://localhost:3000`.

---

### Setting Up Admin Access

#### Step 8 (Optional) — Create an Admin User

To access the admin dashboard, you need to create an admin account using the CLI tool.

**Command Format:**

```bash
# From the backend/ directory:
npm run create-admin -- "<Name>" <email> <password>
```

**How to use:**

| Argument | Description | Rules |
|---|---|---|
| `"Name"` | Admin's display name | Use quotes if name has spaces (e.g., `"John Doe"`) |
| `email` | Admin's login email | Must be a valid email format |
| `password` | Admin's login password | Must be at least 6 characters |

> **💡 Note:** The `--` after `create-admin` is **required** — it tells npm to pass the remaining arguments to the script.

**Examples:**

```bash
# Create an admin with a single-word name
npm run create-admin -- Admin admin@splitsense.com Secret@123

# Create an admin with a full name (use quotes)
npm run create-admin -- "Parani Dharshan" parani@example.com MyP@ssword1

# Alternative: Run the script directly with Node
node scripts/create-admin.js "System Admin" admin@site.com Pass1234
```

**Expected Output:**

```
  ✔ New admin user created successfully.

  Name:   Parani Dharshan
  Email:  baran@example.com
  Role:   admin
  ID:     663f...
```

> **💡 Tip:** If the email already exists in the system, the command will **promote** that existing user to admin and update their name and password.

> **⚠️ Important:** Use strong passwords for admin accounts in production environments.

---

### ✅ Quick Verification

Once everything is running, verify the setup:

1. **Health Check** — Open your browser or run:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "data": { "uptime": 12.34, "environment": "development" },
     "message": "Expense Tracker API is healthy"
   }
   ```

2. **Frontend** — Navigate to `http://localhost:3000` — you should see the login page.

3. **Register** — Create a new account and start tracking expenses!

---

### 🛑 Troubleshooting

| Problem | Solution |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running. Start it with `mongod` or check your system service. |
| `MONGO_URI is not configured` | You forgot to create the `.env` file. Copy `.env.example` to `.env`. |
| `Port 5000 is already in use` | Another process is using port 5000. Change `PORT` in `.env` or kill the process. |
| `CORS error in browser console` | Make sure `CLIENT_ORIGIN` in `.env` matches your frontend URL (`http://localhost:3000`). |
| `Module not found` errors | Run `npm install` in both `backend/` and `frontend/` directories. |
| Frontend shows blank page | Check the browser console for errors. Ensure the backend is running. |
| `Token expired` errors | The access token has a 15-minute lifetime. The app auto-refreshes tokens, but if issues persist, log out and log back in. |

---

## 🔒 Security

SplitSense implements multiple layers of security:

- **Helmet.js** — Sets secure HTTP headers to prevent common attacks (XSS, clickjacking, MIME sniffing)
- **CORS** — Restricted to the configured frontend origin only
- **Rate Limiting** — Login endpoint throttled to 5 failed attempts per 15 minutes
- **NoSQL Injection Prevention** — All MongoDB queries are sanitized via `express-mongo-sanitize`
- **Input Validation** — Every route validates request bodies with `express-validator`
- **Password Security** — Passwords hashed with bcrypt (12 salt rounds by default)
- **JWT Authentication** — Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Soft Deletes** — Expenses are soft-deleted (flagged, not removed) for data integrity

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes with clear messages:
   ```bash
   git commit -m "feat: add expense export to CSV"
   ```
4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request with a description of your changes

### Commit Convention

| Prefix | Usage |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code formatting (no logic change) |
| `refactor:` | Code restructuring |
| `test:` | Adding or updating tests |
| `chore:` | Build/tooling changes |

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute this software.

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/ParaniDharshan04">Parani Dharshan</a></strong>
</p>

<p align="center">
  <a href="#-splitsense--smart-expense-tracker--bill-splitter">⬆ Back to Top</a>
</p>
