# Amazon Store SaaS Version 1

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)

## 📋 Description

Multi-Store SaaS, which is in its DEMO version.


## 🏗️ Architecture

This project consists of two main parts:
- **Backend**: RESTful API built with Express.js and Supabase
- **Frontend**: React application with modern UI components

## 🚀 Technologies Used

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Supabase** - Backend-as-a-Service platform
- **JWT** - JSON Web Tokens for authentication
- **Axios** - HTTP client for API requests
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **CORS** - Cross-Origin Resource Sharing
- **Express Validator** - Server-side validation

### Frontend
- **React 18** - JavaScript library for user interfaces
- **Vite** - Fast build tool and development server
- **React Router DOM** - Declarative routing for React
- **TailwindCSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful hand-crafted SVG icons
- **React Query** - Data fetching and caching library
- **React Hook Form** - Performant forms with easy validation
- **React Hot Toast** - Smoking hot notifications
- **React Table** - Lightweight and extensible data tables

### Development Tools
- **Jest** - JavaScript testing framework
- **Nodemon** - Development server with auto-restart
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS transformation tool
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
amazon-store-saas/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   └── [other backend files]
│   ├── package.json
│   └── [other backend files]
└── frontend/
    ├── src/
    │   └── [frontend source files]
    ├── package.json
    └── [other frontend files]
```

## 🛠️ Installation

### Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend root directory and add your environment variables:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will be running at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend root directory:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will be running at `http://localhost:5173`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Linting
```bash
cd frontend
npm run lint
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🔧 Available Scripts

### Backend Scripts
- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests with Jest

### Frontend Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build

## 🌐 Environment Variables

### Backend Environment Variables
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `JWT_SECRET` | Secret key for JWT token generation |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment mode (development/production) |

### Frontend Environment Variables
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
