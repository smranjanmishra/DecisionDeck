# DecisionDeck - Real-time Voting Platform

A modern, real-time voting application built with React, Node.js, Express.js, and MongoDB. Features live voting updates, secure authentication, and comprehensive admin controls.

## 🚀 Features

- **Real-time Updates**: Live voting results using WebSocket technology
- **Secure Authentication**: JWT-based authentication and authorization
- **User Management**: Complete user registration and profile management
- **Candidate Management**: Admin tools for managing voting candidates
- **Live Analytics**: Real-time voting statistics and trends
- **Responsive Design**: Modern UI that works on all devices
- **Admin Dashboard**: Comprehensive admin panel for system management

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Icons** - Icon library
- **Framer Motion** - Animations

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DecisionDeck
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/decisiondeck
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   # Backend only
   npm run server
   
   # Frontend only
   cd client && npm start
   ```

## 📁 Project Structure

```
DecisionDeck/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Candidate.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── candidates.js
│   │   └── votes.js
│   ├── middleware/
│   │   └── auth.js
│   └── index.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Candidates
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates` - Create candidate (admin)
- `PUT /api/candidates/:id` - Update candidate (admin)
- `DELETE /api/candidates/:id` - Delete candidate (admin)

### Voting
- `POST /api/votes` - Submit vote
- `GET /api/votes/results/:position` - Get voting results
- `GET /api/votes/history` - Get user voting history
- `GET /api/votes/stats/overview` - Get voting statistics

### Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Users must be authenticated to access protected routes.

### User Roles
- **User**: Can vote and view results
- **Admin**: Full access to all features including user and candidate management

## 🎯 Key Features

### Real-time Voting
- Live vote updates using Socket.IO
- Instant result updates across all connected clients
- Real-time progress bars and statistics

### Security
- Password hashing with bcryptjs
- JWT token-based authentication
- Input validation and sanitization
- Rate limiting for API endpoints

### Admin Dashboard
- Comprehensive statistics and analytics
- User management tools
- Candidate management interface
- Voting activity monitoring

### User Experience
- Modern, responsive design
- Intuitive navigation
- Real-time notifications
- Mobile-friendly interface

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables for production
2. Configure MongoDB connection
3. Deploy to your preferred hosting service (Heroku, Vercel, etc.)

### Frontend Deployment
1. Build the React application: `cd client && npm run build`
2. Deploy the build folder to your hosting service

**DecisionDeck** - Making voting accessible, secure, and real-time. 
