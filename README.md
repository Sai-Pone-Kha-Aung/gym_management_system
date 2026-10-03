# 🏋️ Gym Management System

A full-stack, enterprise-grade gym management web application built with **React 19**, **Next.js 16**, **Tailwind CSS v4**, and **MongoDB**. Designed for fitness centers, gym administrators, and staff to streamline daily operations, member onboarding, trainer scheduling, membership subscriptions, and role-based administrative control.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Configuration & Setup](#2-backend-configuration--setup)
  - [3. Frontend Configuration & Setup](#3-frontend-configuration--setup)
- [Initial Admin Account Setup](#-initial-admin-account-setup)
- [Environment Variables Reference](#-environment-variables-reference)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Available Scripts](#-available-scripts)
- [License](#-license)

---

## ✨ Features

### 📊 Interactive Dashboard
- **Operational KPIs**: Quick insight into total members, active trainers, and active membership subscriptions.
- **Today's Agenda**: Real-time list of training sessions scheduled for the day, displaying member, assigned trainer, timing, and session status.

### 👤 Member Management
- Full member directory with search, filter, and pagination.
- Create, view, edit, and archive gym member records.
- Track member profile information (gender, date of birth, contact details, address).
- Comprehensive member details page showing subscription history and personal training records.

### 📋 Membership Plans & Subscriptions
- **Configurable Plans**: Define plans with custom durations (in days), pricing, and feature descriptions.
- **Subscription Tracking**: Associate members with plans, automatically tracking start and expiration dates.
- **Payment Processing**: Record payment methods (`CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `QR_CODE`) and status (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).

### 🏃 Personal Trainers & Sessions
- **Trainer Profiles**: Manage fitness staff records including contact details, specializations (e.g., Strength, HIIT, Nutrition), experience level, and work shifts.
- **Session Scheduling**: Book 1-on-1 personal training sessions between members and trainers with start times, duration, and status updates (`SCHEDULED`, `COMPLETED`, `CANCELLED`).

### 🔐 Authentication & Admin Management
- **Secure Authentication**: JWT-based authentication using cookies and Bearer tokens with encrypted password hashing (`bcrypt`).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `ADMIN` and `STAFF`.
- **User Management**: Admins can invite and manage staff accounts, toggle account statuses (`ACTIVE` / `INACTIVE`), and assign roles.
- **Password Recovery**: Integrated forgot password and reset token flow.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Context**: React Context API (`AuthContext`, `ToastContext`)

### Backend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router API routes & proxy middleware)
- **Database**: [MongoDB](https://www.mongodb.com/) (Native MongoDB Driver v7)
- **Authentication**: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) & [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **CORS Handling**: Dynamic origin configuration via `proxy.js`

---

## 🏗 System Architecture

```mermaid
graph TD
    Client["Browser (Vite + React 19 Frontend)"]
    Proxy["Vite Dev Proxy (:5173/api)"]
    NextAPI["Next.js 16 API Server (:3000)"]
    AuthMW["Auth & RBAC Middleware (proxy.js)"]
    Routes["API Handlers (/api/*)"]
    DB[("MongoDB Database")]

    Client -->|HTTP / JSON Requests| Proxy
    Proxy -->|Forward to http://localhost:3000| NextAPI
    NextAPI --> AuthMW
    AuthMW -->|Verify JWT & Headers| Routes
    Routes -->|Query / Mutate| DB
```

---

## 📁 Directory Structure

```text
gym_management_system/
├── backend/
│   ├── package.json               # Backend dependencies & scripts
│   ├── proxy.js                   # Next.js request proxy & CORS / Auth interceptor
│   └── src/
│       ├── app/
│       │   └── api/               # Next.js App Router API endpoints
│       │       ├── auth/          # Login, Register, Logout, Password reset
│       │       ├── dashboard/     # Summary metrics & daily agenda
│       │       ├── members/       # Member CRUD routes
│       │       ├── membership-plans/ # Plan definitions
│       │       ├── memberships/   # Subscriptions & payment logs
│       │       ├── trainers/      # Trainer directory & profiles
│       │       ├── training-sessions/ # Session bookings & tracking
│       │       └── users/         # Admin user & staff management
│       ├── constants/             # Enums & mock payloads
│       └── lib/
│           ├── auth.js            # JWT signing, verification & RBAC authorization
│           ├── mongodb.js         # MongoDB connection client singleton
│           └── pagination.js      # Pagination helper utilities
│
├── frontend/
│   ├── index.html
│   ├── package.json               # Frontend dependencies & scripts
│   ├── vite.config.js             # Vite config & API reverse proxy
│   └── src/
│       ├── api/                   # Modular API client wrappers
│       ├── components/            # Reusable UI & feedback components (Modal, Button, Table, Toast)
│       ├── context/               # AuthContext & ToastContext providers
│       ├── hooks/                 # Custom React hooks (useAuth, useModal, useDebounce)
│       ├── layouts/               # Dashboard & Auth layouts, Navbar, Sidebar
│       ├── pages/                 # Application views (Dashboard, Members, Trainers, etc.)
│       ├── routes/                # Route definitions & ProtectedRoute guards
│       └── utils/                 # Formatters, date utilities, and constants
│
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9+ (or `pnpm` / `yarn` / `bun`)
- **MongoDB**: A running local instance (`mongodb://localhost:27017`) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

---

### 1. Clone Repository

```bash
git clone https://github.com/Sai-Pone-Kha-Aung/gym_management_system.git
cd gym_management_system
```

---

### 2. Backend Configuration & Setup

1. **Navigate to the backend directory and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the `backend/` directory:
   ```env
   # Database connection
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=gym_management

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here

   # Allowed CORS Origins (comma-separated)
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

3. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The backend API will be available at **`http://localhost:3000`**.

---

### 3. Frontend Configuration & Setup

1. **Open a new terminal, navigate to the frontend directory, and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **(Optional) Configure environment variables:**
   Create a `.env` file in `frontend/` if you wish to override defaults:
   ```env
   # Leave empty to use Vite's built-in dev proxy to localhost:3000
   VITE_API_URL=
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend application will run at **`http://localhost:5173`**.

---

## 👑 Initial Admin Account Setup

The system includes automatic first-admin bootstrapping:

1. When the database is newly initialized with **zero users**, the first account created via the registration endpoint is automatically granted the **`ADMIN`** role.
2. You can register the initial administrator by sending a request to `/api/auth/register` (e.g. using curl, Bruno, or Postman):

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@gym.com",
    "password": "password123",
    "role": "ADMIN"
  }'
```

3. Once created, open **`http://localhost:5173/login`** and sign in with your admin credentials.
4. From the application UI, you can now navigate to **Users** (`/users`) to create additional `ADMIN` or `STAFF` members.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | — | MongoDB connection string (e.g. `mongodb://localhost:27017` or Atlas URL) |
| `DB_NAME` | **Yes** | `gym_management` | The database name inside your MongoDB instance |
| `JWT_SECRET` | **Yes** | `gym-default-secret-jwt-key-2026` | Secret key used for signing & verifying JWT authentication tokens |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | Comma-separated list of origins allowed by CORS |
| `NODE_ENV` | No | `development` | Node environment mode (`development` or `production`) |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `""` (Empty string) | Base URL for API requests. Default uses Vite dev server's `/api` proxy |

---

## 📡 API Endpoints Reference

All API routes are prefixed with `/api`. Protected routes require a valid JWT token via `Authorization: Bearer <token>` or HTTP cookie.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a user (initial user becomes `ADMIN`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/auth/logout` | Authenticated | Log out and clear session cookie |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid reset token |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Staff / Admin | Get aggregated KPI statistics and today's agenda |

### Members (`/api/members`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/members` | Staff / Admin | List members with pagination & search |
| `POST` | `/api/members` | Staff / Admin | Create a new member |
| `GET` | `/api/members/[id]` | Staff / Admin | Get member profile, membership, and sessions |
| `PUT` | `/api/members/[id]` | Staff / Admin | Update member details |
| `DELETE` | `/api/members/[id]` | Staff / Admin | Soft delete member |

### Membership Plans (`/api/membership-plans`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/membership-plans` | Staff / Admin | List all membership plans |
| `POST` | `/api/membership-plans` | Staff / Admin | Create a new membership plan |
| `GET` | `/api/membership-plans/[id]` | Staff / Admin | Get plan details |
| `PUT` | `/api/membership-plans/[id]` | Staff / Admin | Update plan details |
| `DELETE` | `/api/membership-plans/[id]` | Staff / Admin | Delete plan |

### Memberships & Payments (`/api/memberships`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/memberships` | Staff / Admin | List all active/expired memberships |
| `POST` | `/api/memberships` | Staff / Admin | Assign a plan to a member & record payment |
| `GET` | `/api/memberships/[id]` | Staff / Admin | Get membership subscription details |
| `PUT` | `/api/memberships/[id]` | Staff / Admin | Update membership or payment status |
| `DELETE` | `/api/memberships/[id]` | Staff / Admin | Cancel membership subscription |

### Trainers (`/api/trainers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/trainers` | Staff / Admin | List all personal trainers |
| `POST` | `/api/trainers` | Staff / Admin | Add a new trainer |
| `GET` | `/api/trainers/[id]` | Staff / Admin | Get trainer details and upcoming sessions |
| `PUT` | `/api/trainers/[id]` | Staff / Admin | Update trainer profile |
| `DELETE` | `/api/trainers/[id]` | Staff / Admin | Delete trainer |

### Training Sessions (`/api/training-sessions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/training-sessions` | Staff / Admin | List scheduled sessions |
| `POST` | `/api/training-sessions` | Staff / Admin | Book a training session |
| `GET` | `/api/training-sessions/[id]` | Staff / Admin | Get session details |
| `PUT` | `/api/training-sessions/[id]` | Staff / Admin | Update session (reschedule or change status) |
| `DELETE` | `/api/training-sessions/[id]` | Staff / Admin | Cancel/delete training session |

### User Management (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | **Admin Only** | List all administrative and staff users |
| `POST` | `/api/users` | **Admin Only** | Create a new user account |
| `GET` | `/api/users/[id]` | **Admin Only** | Get user account details |
| `PUT` | `/api/users/[id]` | **Admin Only** | Update user role, status, or password |
| `DELETE` | `/api/users/[id]` | **Admin Only** | Delete user account |

---

## 🛡 Role-Based Access Control (RBAC)

The application enforces strict role validation at both the frontend routing layer and the backend API middleware:

| Feature / Module | STAFF Role | ADMIN Role |
|---|:---:|:---:|
| View Dashboard & KPIs | ✅ | ✅ |
| Manage Members (CRUD) | ✅ | ✅ |
| Manage Plans (CRUD) | ✅ | ✅ |
| Manage Subscriptions & Payments | ✅ | ✅ |
| Manage Trainers & Schedules | ✅ | ✅ |
| Book & Update Training Sessions | ✅ | ✅ |
| View User & Staff Accounts (`/users`) | ❌ | ✅ |
| Create & Edit Users / Change Roles | ❌ | ✅ |

---

## 📜 Available Scripts

### Backend (`/backend`)
- `npm run dev`: Starts the Next.js development server on port 3000.
- `npm run build`: Compiles the Next.js production build.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Runs ESLint to check for code quality and syntax errors.

### Frontend (`/frontend`)
- `npm run dev`: Launches the Vite development server with HMR on port 5173.
- `npm run build`: Compiles optimized assets into the `dist/` directory.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint across all frontend components and source files.

---

## 📄 License

This project is developed for educational and gym management purposes. Refer to the repository owner for licensing terms.
