# SRPH-MIS User Management System - Fixed Release

## Overview
This release includes comprehensive fixes for data persistence, user management with permissions, and Windows Server compatibility improvements.

## Major Fixes & New Features

### ✅ Fixed Issues
1. **Authentication System**
   - Fixed session deserialization errors
   - Switched to in-memory session store for better Windows compatibility
   - Resolved socket binding issues (ENOTSUP errors)

2. **Data Persistence**
   - Fixed components page data disappearing after adding items
   - Fixed VM inventory missing details and edit functionality
   - Improved in-memory storage reliability

3. **User Management System**
   - **NEW**: Comprehensive User Management page for administrators
   - **NEW**: Granular permission system for all modules
   - **NEW**: Role-based access control (RBAC)

### 🎯 User Management Features
The new User Management system allows administrators to:

- **View Users**: Clean table with user details, roles, and status
- **Add Users**: Create new accounts with department and admin privileges
- **Edit Users**: Update user information and roles
- **Delete Users**: Remove users (except administrators)
- **Permissions Management**: Configure granular permissions for each user:
  - **Users**: View, Edit, Add permissions
  - **Assets**: View, Edit, Add permissions
  - **Components**: View, Edit, Add permissions
  - **Accessories**: View, Edit, Add permissions
  - **Licenses**: View, Edit, Add permissions
  - **Reports**: View, Edit, Add permissions
  - **VM Inventory**: View, Edit, Add permissions
  - **Network Discovery**: View, Edit, Add permissions
  - **Settings**: View, Edit, Add permissions
  - **Admin Panel**: View, Edit, Add permissions

### 🔧 Technical Improvements
- **Session Management**: In-memory session store prevents PostgreSQL session table dependencies
- **API Endpoints**: New `/api/users/:id/permissions` endpoint for permission updates
- **Windows Compatibility**: Enhanced socket binding and module loading
- **Port Configuration**: Consistent port 3000 usage across all components

## Installation & Deployment

### Prerequisites
- Node.js 18+ or 20+
- Windows Server 2019/2022 (optional)
- PostgreSQL 12+ (for production) or in-memory storage (development)

### Quick Start

1. **Extract the package**
   ```cmd
   unzip srph-mis-user-management-fixed.zip
   cd srph-mis-user-management-fixed
   ```

2. **Install dependencies**
   ```cmd
   npm install
   ```

3. **Configure environment**
   Copy `.env` file and update settings:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/srph_mis
   SESSION_SECRET=your-secure-session-secret
   NODE_ENV=production
   PORT=3000
   ```

4. **Start the application**
   ```cmd
   npm run dev
   ```

5. **Access the application**
   Open browser to: http://localhost:3000

### Windows-Specific Start Options

Choose the appropriate startup method:

1. **Standard Start** (Recommended)
   ```cmd
   npm run dev
   ```

2. **Direct Windows Start**
   ```cmd
   start-windows-direct.bat
   ```

3. **Development Mode**
   ```cmd
   dev-windows.bat
   ```

## Default Admin Access

Initial admin account:
- **Username**: admin
- **Password**: admin123
- **Role**: Administrator

⚠️ **Important**: Change the default password immediately after first login.

## User Management Access

1. Log in as an administrator
2. Navigate to **Administration** → **User Management** in the sidebar
3. Start creating users and configuring permissions

## Permission System

Each user can be assigned specific permissions for each module:
- **View**: Can see the module and its data
- **Edit**: Can modify existing records
- **Add**: Can create new records

Administrators have full access to all modules by default.

## API Endpoints

### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/permissions` - Update user permissions

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user
- `POST /api/register` - Register new user (admin only)

## Database Schema

The system now includes proper user permissions storage:

```sql
-- Users table includes permissions JSON field
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  department VARCHAR,
  isAdmin BOOLEAN DEFAULT FALSE,
  permissions JSONB
);
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```cmd
   netstat -ano | findstr :3000
   taskkill /PID <process_id> /F
   ```

2. **Session errors**
   - Clear browser cache and cookies
   - Restart the application

3. **Permission denied**
   - Ensure you're logged in as administrator
   - Check user permissions in User Management

4. **Database connection issues**
   - Verify DATABASE_URL in .env file
   - Ensure PostgreSQL is running
   - Use in-memory storage for testing

### Windows Server Deployment

For production Windows Server deployment:

1. Install Node.js 18+ LTS
2. Configure IIS with reverse proxy (optional)
3. Set up Windows Service (optional)
4. Configure firewall rules for port 3000

## Support & Documentation

- **User Manual**: Available at `/user-manual` when application is running
- **API Documentation**: Built-in API explorer
- **Activity Logs**: Track all user actions and system changes

## Version Information

- **Release**: User Management Fixed
- **Date**: January 2025
- **Compatibility**: Windows Server 2019/2022, Node.js 18+
- **Database**: PostgreSQL 12+ or In-Memory Storage

## Security Notes

- All passwords are hashed using scrypt with random salts
- Session data is stored securely
- Admin privileges are required for user management
- Audit trail tracks all user actions