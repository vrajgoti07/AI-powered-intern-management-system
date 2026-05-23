# AI-Powered Intern Management System - Backend

Enterprise-grade backend API built with Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access + Refresh Tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcrypt
- **Email**: Nodemailer

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/                # Configuration files
│   │   ├── env.ts            # Environment variables
│   │   └── database.ts       # Database connection
│   ├── controllers/           # Request handlers
│   │   └── auth.controller.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── middleware/            # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── services/              # Business logic
│   │   └── auth.service.ts
│   ├── utils/                 # Utility functions
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── email.ts
│   │   ├── response.ts
│   │   └── logger.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── validations/           # Zod schemas
│   │   └── auth.validation.ts
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/intern_management?schema=public"

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@internmanagement.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Setup PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE intern_management;
```

### 4. Run Prisma Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint                    | Description              | Access  |
|--------|----------------------------|--------------------------|---------|
| POST   | `/api/v1/auth/register`    | Register new user        | Public  |
| POST   | `/api/v1/auth/login`       | Login user               | Public  |
| POST   | `/api/v1/auth/logout`      | Logout user              | Private |
| POST   | `/api/v1/auth/refresh-token` | Refresh access token   | Public  |
| POST   | `/api/v1/auth/forgot-password` | Request password reset | Public  |
| POST   | `/api/v1/auth/reset-password` | Reset password        | Public  |
| GET    | `/api/v1/auth/me`          | Get current user         | Private |

### Health Check

| Method | Endpoint           | Description    | Access |
|--------|--------------------|----------------|--------|
| GET    | `/api/v1/health`   | API health check | Public |

## 🔐 Authentication Flow

### 1. Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "INTERN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "INTERN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 3. Access Protected Routes

```bash
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

### 4. Refresh Token

```bash
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 5. Forgot Password

```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 6. Reset Password

```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

## 👥 User Roles

The system supports three roles:

- **HR**: Human Resources - Manages interns, mentors, and departments
- **MENTOR**: Mentors - Manages assigned interns and tasks
- **INTERN**: Interns - Access to personal dashboard and tasks

## 🔒 Security Features

- **JWT Authentication**: Access and refresh token mechanism
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Helmet**: Security headers
- **CORS**: Configured cross-origin resource sharing
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **Password Strength**: Enforced strong password policy

## 🗄️ Database Models

### User
- Base authentication model
- Stores credentials and role
- One-to-one with Intern or Mentor

### Intern
- Extended profile for interns
- Linked to department and mentor
- Tracks performance and attendance

### Mentor
- Extended profile for mentors
- Linked to department
- Manages multiple interns

### Department
- Organizational units
- Contains interns and mentors

### Task
- Assigned to interns by mentors
- Tracks progress and submissions

### Feedback
- Mentor feedback for interns
- Rating and comments

### Announcement
- System-wide or role-specific announcements

### Attendance
- Daily attendance tracking for interns

## 📝 Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Production
npm run build            # Compile TypeScript to JavaScript
npm start                # Start production server

# Prisma
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (Database GUI)
```

## 🧪 Testing API with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "intern@example.com",
    "password": "SecurePass123!",
    "name": "Test Intern",
    "role": "INTERN"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "intern@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🚨 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "timestamp": "2026-05-20T10:30:00.000Z"
}
```

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { },
  "timestamp": "2026-05-20T10:30:00.000Z"
}
```

## 🔄 Next Steps (Phase 2)

- [ ] Intern Management APIs
- [ ] Mentor Management APIs
- [ ] Department Management APIs
- [ ] Task Management APIs
- [ ] Feedback System APIs
- [ ] Announcement APIs
- [ ] Attendance Tracking APIs
- [ ] Analytics & Reports APIs
- [ ] File Upload (Resume, Submissions)
- [ ] Real-time Notifications

## 📄 License

MIT

## 👨‍💻 Author

AI-Powered Intern Management System Team
