# Konvo Project Manager - Backend API

A fully functional Node.js/Express backend for a Project & Task Manager application with JWT authentication, OTP verification, and Supabase integration.

## Features

✅ **Authentication**
- User signup and login with JWT tokens
- OTP-based authentication via email
- Password hashing with bcryptjs
- Secure token verification middleware

✅ **Projects Management**
- Create, read, update, and delete projects
- User-specific project isolation
- Project metadata (title, description, timestamps)

✅ **Tasks Management**
- Create, read, update, and delete tasks
- Mark tasks as complete/incomplete
- Task filtering by project
- Due date support
- Task status tracking

✅ **Error Handling**
- Comprehensive validation middleware
- Custom error handling
- Proper HTTP status codes

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs
- **Email:** Nodemailer
- **Validation:** express-validator
- **HTTP Client:** Axios

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account with database tables created
- SMTP credentials (Gmail recommended)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/AritraDhar567/konvo-fullstack-backend.git
cd konvo-fullstack-backend

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# OTP Configuration
OTP_EXPIRY=5
```

### 4. Database Setup

Ensure your Supabase database has the following tables:

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  otp VARCHAR(6),
  otp_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Projects Table:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Tasks Table:**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Projects Routes

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Project",
  "description": "Project description"
}
```

#### Get All Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

#### Get Project by ID
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

### Tasks Routes

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Task Title",
  "project_id": "project-uuid",
  "due_date": "2024-12-31T23:59:59Z"
}
```

#### Get All Tasks
```http
GET /api/tasks
Authorization: Bearer <token>
```

#### Get Tasks by Project
```http
GET /api/tasks/project/:projectId
Authorization: Bearer <token>
```

#### Get Task by ID
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Task",
  "due_date": "2024-12-31T23:59:59Z",
  "completed": false
}
```

#### Toggle Task Completion
```http
PATCH /api/tasks/:id/toggle
Authorization: Bearer <token>
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

## Response Format

All responses follow a consistent JSON format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error Handling

Errors return appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Server Error

## Security Features

✅ Password hashing with bcryptjs
✅ JWT token authentication
✅ Input validation and sanitization
✅ User-specific data isolation
✅ CORS enabled
✅ Error handling without exposing sensitive data

## Project Structure

```
konvo-fullstack-backend/
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   └── taskController.js
├── routes/
│   ├── auth.js
│   ├── projects.js
│   └── tasks.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## License

ISC

## Support

For questions or issues, contact: TeamBlisser@gmail.com
