# Full-Stack Task Management System

A comprehensive task management and collaboration platform built with Node.js, Express, SQL Server, and vanilla JavaScript. Features include dashboard management, kanban boards, task tracking, user authentication, and AI-powered task assignment.

## Features

- **User Authentication**: JWT-based authentication with secure login/signup
- **Dashboard Management**: Create and manage multiple dashboards with privacy controls
- **Kanban Boards**: Visual task organization with drag-and-drop functionality
- **Task Management**: Create, assign, and track tasks with detailed metadata
- **Collaboration**: Invite users to dashboards with role-based permissions (Owner, Editor, Viewer)
- **AI Integration**: Gemini AI for task analysis and agent assignment
- **User Profiles**: Customizable profiles with activity tracking
- **Real-time Updates**: Dynamic UI updates without page reloads

## Prerequisites

- **Node.js** (v16 or higher)
- **SQL Server** (or SQL Server Express)
- **npm** or **yarn** package manager

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/full-stack-development.git
cd full-stack-development
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Database Setup

Create a `.env` file in the `backend` directory:
```env
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_DATABASE=FullStack
DB_PORT=1433
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

Run the database schema:
```sql
-- Execute backend/schema.sql in SQL Server Management Studio or:
sqlcmd -S localhost -U your_username -P your_password -i backend/schema.sql
```

Optional: Seed sample data
```sql
sqlcmd -S localhost -U your_username -P your_password -i backend/seed.sql
```

### 4. Build TypeScript
```bash
cd backend
npx tsc
```

### 5. Start the Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

## Project Structure

```
full-stack-development/
├── backend/
│   ├── ai/                      # AI integration modules
│   │   ├── aiGemini.js          # Gemini AI integration
│   │   ├── aiAssignAgent.js     # Task assignment logic
│   │   └── aiFileManager.js     # File management
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── boardController.js
│   │   └── taskController.js
│   ├── models/                  # Database models
│   │   ├── userModel.js
│   │   ├── dashboardModel.js
│   │   ├── boardModel.js
│   │   └── taskModel.js
│   ├── routes/                  # API routes
│   │   ├── userRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── taskRoutes.js
│   │   └── aiRoutes.js
│   ├── middleware/              # Express middleware
│   │   ├── jwtAuth.js
│   │   └── validation/
│   ├── migrations/              # Database migrations
│   ├── src/
│   │   └── server.ts            # Main server file
│   ├── dbConfig.js              # Database configuration
│   ├── schema.sql               # Database schema
│   └── package.json
│
└── frontend/
    ├── dashboard/               # Dashboard page
    ├── kanban/                  # Kanban board interface
    ├── login/                   # Login page
    ├── signup/                  # Registration page
    ├── settings/                # User settings
    │   ├── profile/
    │   ├── security/
    │   └── activity/
    ├── dashboard-settings/      # Dashboard configuration
    ├── auth-utils.js            # Authentication utilities
    └── utils/                   # Shared utilities
        └── domHelpers.js
```

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login (returns JWT)
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password` - Reset password with token

### Dashboards
- `GET /api/dashboards` - Get all user dashboards
- `GET /api/dashboards/:id` - Get specific dashboard
- `POST /api/dashboards` - Create new dashboard
- `PUT /api/dashboards/:id` - Update dashboard
- `DELETE /api/dashboards/:id` - Delete dashboard

### Boards
- `GET /api/dashboards/:id/boards` - Get all boards in dashboard
- `POST /api/dashboards/:id/boards` - Create board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board (optionally move tasks)

### Tasks
- `GET /api/boards/:id/tasks` - Get all tasks in board
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### AI
- `POST /api/ai/gemini` - Gemini AI analysis

## Authentication

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in `localStorage` and automatically sent with requests via the `authFetch` utility.

**Token Payload:**
```javascript
{
  id: userId,
  email: "user@example.com",
  fullName: "John Doe",
  role: "User"
}
```

## 🗄️ Database Schema

### Core Tables
- **Users**: User accounts and authentication
- **Dashboards**: Top-level project containers
- **UserDashboards**: User-dashboard relationships with roles
- **Boards**: Kanban columns within dashboards
- **Tasks**: Individual task items with metadata
- **PendingInvitations**: Email invitations for non-registered users

### Cascade Rules
- Deleting a **Dashboard** cascades to **Boards** and **UserDashboards**
- Deleting a **Board** requires moving or deleting **Tasks** first (no cascade)

## Development

### Run in Development Mode
```bash
cd backend
npm run dev
```

### Build TypeScript
```bash
cd backend
npx tsc
```

### Run Tests (if implemented)
```bash
npm test
```

## Frontend Pages

- `/login` - User authentication
- `/signup` - New user registration
- `/dashboard` - Dashboard overview
- `/kanban?id=<dashboardId>` - Kanban board view
- `/dashboard-settings?id=<dashboardId>` - Dashboard configuration
- `/settings/profile` - User profile settings
- `/settings/security` - Password and security
- `/settings/activity` - Activity log

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Authors

- Your Name - Initial work

## Acknowledgments

- Google Gemini AI for intelligent task assignment
- Express.js framework
- Microsoft SQL Server
