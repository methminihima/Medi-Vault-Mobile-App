# MediVault Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
1. Open pgAdmin
2. Create a new database called `medivault_db`
3. Right-click on the database → Query Tool
4. Open and run `database/schema.sql`

### 3. Configure Environment Variables
1. Open `backend/.env` file
2. Update these values with your PostgreSQL credentials:
   ```
   DB_NAME=medivault_db
   DB_USER=postgres
   DB_PASSWORD=your_actual_password
   ```

### 4. Start the Backend Server
```bash
npm run dev
```

The server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new patient

### Users (Admin)
- `POST /api/users/create` - Create new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Testing the API

You can test using:
1. Postman
2. Thunder Client (VS Code extension)
3. curl commands

Example:
```bash
curl http://localhost:5000/api/health
```
