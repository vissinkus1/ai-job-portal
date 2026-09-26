# 🚀 AI Job Portal

A full-stack, AI-powered job portal built with React and Node.js featuring real-time chat, intelligent job recommendations, resume scoring, and skill gap analysis.

## ✨ Features

### For Job Seekers
- 🔍 **Smart Job Search** — Filter by title, company, location, type, and experience level
- 🤖 **AI Recommendations** — TF-IDF powered job matching based on your skills and profile
- 📊 **Resume Scoring** — Get your resume scored against specific job descriptions
- 🎯 **Skill Gap Analysis** — Identify missing skills and get learning resources
- 💾 **Saved Jobs** — Bookmark jobs for later
- 🔔 **Job Alerts** — Get notified when new jobs match your criteria
- 📋 **Application Tracking** — Monitor all your applications in one place
- 💬 **Real-time Chat** — Communicate directly with employers

### For Employers
- 📝 **Post & Manage Jobs** — Full CRUD with rich text descriptions
- 👥 **Applicant Management** — Review, shortlist, reject, and schedule interviews
- 🏢 **Company Profile** — Showcase your company culture, benefits, and social links
- 📈 **Analytics Dashboard** — Track job views, applications, and hiring pipeline
- 💬 **Real-time Chat** — Communicate directly with candidates

### For Admins
- 👤 **User Management** — View, search, and manage all platform users
- 📊 **Platform Analytics** — Overview of platform health and activity

### General
- 🌙 **Dark / Light Mode** — System-aware theme toggle
- 🔐 **Secure Auth** — JWT + httpOnly refresh tokens, email verification, rate limiting
- ⚡ **Real-time** — Socket.io for chat, typing indicators, and notifications
- 🛡️ **Security** — Helmet, input sanitization, CORS, rate limiting

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 7, React Router 7, Axios, Socket.io Client, ReactQuill |
| **Backend** | Node.js, Express 5, Socket.io, Mongoose (MongoDB) |
| **AI/ML** | Custom TF-IDF Engine, Resume Scorer, Skill Gap Analyzer |
| **Auth** | JWT, bcryptjs, httpOnly cookies, refresh token rotation |
| **Email** | Nodemailer (SMTP) |
| **Security** | Helmet, express-rate-limit, DOMPurify, express-validator |
| **Testing** | Vitest, Supertest |

---

## 📁 Project Structure

```
ai-job-portal/
├── Client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── config/            # API configuration
│       ├── context/           # React contexts (Auth, Theme)
│       ├── pages/             # Route page components
│       ├── services/          # Axios API instance
│       ├── App.jsx            # Root component + routing
│       └── main.jsx           # Entry point
├── server/                    # Express backend
│   ├── config/                # Database configuration
│   ├── controllers/           # Route handlers
│   ├── middleware/             # Auth, validation, error handling
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API route definitions
│   ├── utils/                 # AI engines, email, resume parser
│   ├── uploads/               # User-uploaded files
│   ├── tests/                 # Vitest test suites
│   └── index.js               # Server entry point
├── package.json               # Root dependencies
├── Dockerfile                 # Docker container config
├── docker-compose.yml         # Multi-service orchestration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **MongoDB** (local or Atlas connection string)
- **npm** ≥ 9.x

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-job-portal.git
cd ai-job-portal
```

### 2. Install Dependencies
```bash
# Root dependencies (server)
npm install

# Client dependencies
cd Client
npm install
cd ..
```

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/ai_job_portal
JWT_SECRET=your_secure_random_secret_here
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_ORIGIN=http://localhost:5173
```

> **Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) rather than your account password.

### 4. Start Development Servers

**Terminal 1 — Backend:**
```bash
node server/index.js
```

**Terminal 2 — Frontend:**
```bash
cd Client
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Run Tests
```bash
npm test
```

---

## 🐳 Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down
```

This starts:
- **Frontend** on port `5173`
- **Backend** on port `5000`
- **MongoDB** on port `27017`

---

## 🚀 Deployment Guide

The application supports **both split deployment** (Vercel frontend + Render backend) and **unified single-server deployment** (Render / Railway / Docker).

### Option A: Split Deployment (Recommended)

#### 1. Backend on [Render](https://render.com) or [Railway](https://railway.app)
1. Create a **New Web Service** connected to your repository.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://...` (your MongoDB Atlas connection string)
   - `JWT_SECRET`: A secure random string (minimum 32 characters)
   - `FRONTEND_ORIGIN`: Your frontend URL (e.g. `https://your-app.vercel.app`)
   - `EMAIL_USER`: Your Gmail / SMTP email
   - `EMAIL_PASS`: Your Gmail App Password
5. Note your backend URL (e.g. `https://your-backend.onrender.com`).

#### 2. Frontend on [Vercel](https://vercel.com)
1. Import your repository into Vercel.
2. Set **Root Directory**: `Client`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: Your backend URL (e.g. `https://your-backend.onrender.com`)
7. Click **Deploy**.

---

### Option B: Unified Deployment (Single Web Service / Docker)

The backend automatically detects and serves the built React frontend (`Client/dist`) when present:

1. Build Command: `npm run build` (builds frontend into `Client/dist`)
2. Start Command: `npm start` (starts Express server serving API + static frontend)
3. Both API and Frontend run on the single assigned port!

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/logout` | Logout and clear tokens |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| PUT | `/api/auth/update-password` | Change password |
| DELETE | `/api/auth/delete-account` | Delete account permanently |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs (with filters) |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Create a new job (employer) |
| PUT | `/api/jobs/:id` | Update a job (employer) |
| DELETE | `/api/jobs/:id` | Delete a job (employer) |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications/:jobId` | Apply for a job |
| GET | `/api/applications/my` | Get user's applications |
| GET | `/api/applications/job/:jobId` | Get applicants for a job |
| PUT | `/api/applications/:id/status` | Update application status |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get AI job recommendations |
| POST | `/api/skill-gap/analyze` | Analyze skill gaps |
| POST | `/api/resume-score/analyze` | Score resume against job |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List conversations |
| GET/POST | `/api/chat/:userId` | Get/send messages |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/analytics/*` | Platform analytics |
| GET | `/api/health` | Health check |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
