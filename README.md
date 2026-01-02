# MediVault - Healthcare Management System 🏥

A comprehensive healthcare management system built with React Native (Expo) and PostgreSQL.

## 🚀 Quick Start

### Frontend (React Native App)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npx expo start
   ```

### Backend (Node.js + PostgreSQL)

1. **Setup database in pgAdmin**
   - Create database: `medivault_db`
   - Run: `backend/database/schema.sql`

2. **Start backend server**
   ```bash
   # Double-click: start-backend.bat
   # OR
   cd backend
   npm install
   npm run dev
   ```

3. **Configure database credentials**
   - Edit `backend/.env`
   - Update your PostgreSQL password

## 📚 Documentation

- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - Quick reference guide
- **[BACKEND_CONNECTION_GUIDE.md](BACKEND_CONNECTION_GUIDE.md)** - Detailed setup instructions
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - System architecture
- **[backend/README.md](backend/README.md)** - Backend API documentation

## 🎯 Current Features

✅ **Admin Dashboard**
- User management
- Create users (connected to database!)
- View users by role
- System statistics

✅ **Authentication System**
- Login/Register
- Session management
- Role-based access

✅ **Database Integration**
- PostgreSQL backend
- RESTful API
- Secure password hashing

## 🏗️ Project Structure

```
├── app/                    # React Native screens
│   ├── (auth)/            # Authentication screens
│   └── (tabs)/            # Main app screens
├── components/            # Reusable components
│   ├── admin/            # Admin-specific components
│   ├── doctor/           # Doctor components
│   └── shared/           # Shared components
├── src/
│   ├── api/              # API client
│   ├── config/           # Configuration
│   └── services/         # Business logic
└── backend/              # Node.js backend
    ├── routes/           # API routes
    ├── config/           # Database config
    └── database/         # SQL schemas
```

## 🔧 Technology Stack

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT, bcrypt

## 📱 Available Screens

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
