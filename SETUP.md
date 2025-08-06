# DecisionDeck Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)

### Installation

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/decisiondeck
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

## 📊 New Features Added

### Analytics Dashboard
- **Real-time Charts**: Voting trends, hourly patterns, position analytics
- **Interactive Filters**: Time range selection (24h, 7d, 30d)
- **Export Functionality**: Download analytics data as JSON
- **Responsive Design**: Works on all devices

### Enhanced Security
- Rate limiting for authentication
- Enhanced input validation
- Better error handling
- Role-based access control

### Performance Optimizations
- Database indexing improvements
- Connection pooling
- Enhanced Socket.IO configuration
- Better error handling and recovery

## 🔧 Backend Optimizations

### Server (`server/index.js`)
- ✅ Enhanced MongoDB connection with pooling
- ✅ Improved Socket.IO configuration
- ✅ Comprehensive error handling
- ✅ Graceful shutdown handling
- ✅ Enhanced security middleware

### Models
- ✅ **User Model**: Profile fields, stats tracking, virtual fields
- ✅ **Candidate Model**: Metadata, analytics methods, enhanced validation
- ✅ **Vote Model**: Device analytics, verification system

### Authentication
- ✅ Rate limiting for auth attempts
- ✅ Enhanced token validation
- ✅ Role-based access control
- ✅ Optional authentication middleware

### Analytics API
- ✅ Real-time dashboard analytics
- ✅ Candidate performance analytics
- ✅ Position-wise analytics
- ✅ User behavior analytics (admin)
- ✅ Real-time updates

## 🎨 Frontend Optimizations

### Analytics Dashboard (`client/src/pages/Analytics.js`)
- ✅ Comprehensive charts with Chart.js
- ✅ Real-time updates via Socket.IO
- ✅ Interactive filters and time ranges
- ✅ Export functionality
- ✅ Responsive design with animations

### Enhanced Socket Context
- ✅ Analytics room functionality
- ✅ Better error handling and reconnection
- ✅ Enhanced connection status tracking

### Navigation
- ✅ Analytics link in navbar
- ✅ Improved responsive design

### Styling
- ✅ Comprehensive analytics styles
- ✅ Improved responsive design
- ✅ Better animations and transitions

## 📱 Available Routes

### Public Routes
- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/results` - Voting results

### Protected Routes
- `/dashboard` - User dashboard
- `/voting` - Voting interface
- `/analytics` - **NEW** Analytics dashboard
- `/profile` - User profile

### Admin Routes
- `/admin` - Admin panel

## 🔍 API Endpoints

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Main analytics dashboard
- `GET /api/analytics/candidates/:id` - Candidate-specific analytics
- `GET /api/analytics/positions/:position` - Position-specific analytics
- `GET /api/analytics/users/behavior` - User behavior analytics (admin)
- `GET /api/analytics/realtime` - Real-time analytics updates

### Existing Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate (admin)
- `GET /api/votes/results/:position` - Get voting results
- `POST /api/votes` - Submit vote

## 🎯 Key Features

### Analytics Dashboard
1. **Overview Cards**: Total votes, users, conversion rate, average votes
2. **Interactive Charts**: Voting trends, hourly patterns, position analytics
3. **Top Candidates**: Ranking system with visual indicators
4. **Real-time Updates**: Live connection status and vote counts
5. **Engagement Metrics**: User participation and behavior analysis

### Enhanced Security
- Rate limiting for authentication attempts
- Enhanced input validation
- Better error handling with specific error codes
- Token refresh functionality
- Role-based access control

### Performance Improvements
- Database indexing optimization
- Connection pooling for MongoDB
- Enhanced Socket.IO with reconnection logic
- Optimized re-renders and lazy loading

## 🚀 Running the Application

1. **Development Mode**
   ```bash
   npm run dev
   ```
   This starts both server (port 5000) and client (port 3000)

2. **Production Build**
   ```bash
   npm run build
   ```

3. **Server Only**
   ```bash
   npm run server
   ```

4. **Client Only**
   ```bash
   npm run client
   ```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check your MONGODB_URI in .env file
   - For local MongoDB: `mongodb://localhost:27017/decisiondeck`

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on ports 3000/5000

3. **Chart.js Errors**
   - Ensure all dependencies are installed: `npm run install-all`
   - Clear browser cache

4. **Socket Connection Issues**
   - Check if server is running
   - Verify CORS settings
   - Check browser console for errors

## 📈 Analytics Features

### Dashboard Overview
- Real-time vote counting
- User engagement metrics
- Conversion rate analysis
- Performance trends

### Interactive Charts
- **Voting Trends**: Line chart showing vote activity over time
- **Hourly Activity**: Bar chart showing voting patterns by hour
- **Position Analytics**: Comparison of votes across positions
- **Device Distribution**: Doughnut chart showing device types

### Export Functionality
- Download analytics data as JSON
- Filtered by time range
- Includes all chart data and statistics

## 🎉 Success!

Your DecisionDeck application is now fully optimized with:
- ✅ Comprehensive Analytics Dashboard
- ✅ Enhanced Security Features
- ✅ Performance Optimizations
- ✅ Real-time Updates
- ✅ Responsive Design

The application is ready to use! Access the Analytics Dashboard at `/analytics` after logging in. 