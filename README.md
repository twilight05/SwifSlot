# SwiftSlot - Complete Booking System

A full-stack booking system built with **Node.js 20+, TypeScript, Express, Sequelize (MySQL)** backend and **React 19, Vite, TypeScript, Tailwind CSS** frontend.

## Features

- **Vendor Management**: List vendors with timezone support (Lagos)
- **Availability System**: 30-minute time slots from 09:00-17:00 Lagos time
- **Smart Booking**: 2-hour advance booking buffer with double-booking prevention
- **Real-time UI**: Responsive design with mobile-first approach
- **Progress Tracking**: Multi-stage booking flow (Creating → Paying → Confirming → Completed)
- **Error Handling**: Toast notifications with user-friendly messages
- **Idempotency**: Duplicate request protection via idempotency keys
- **Testing**: Minimal test suite covering critical business logic

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js 5.1.0
- **Database**: MySQL 8.4 with Sequelize ORM
- **Testing**: Vitest + Supertest
- **Key Features**: UTC timezone handling, unique constraints, idempotency

### Frontend  
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.15
- **Routing**: React Router 7.9.2
- **State**: Zustand (minimal state shape)

## Prerequisites

- **Node.js**: 20+ 
- **MySQL**: 8.4+ (or compatible)
- **npm**: Latest version

## Setup Instructions

### 1. Clone Repository

```bash
git clone <https://github.com/twilight05/SwifSlot.git>
cd SwiftSlot
```

### 2. Database Setup

```bash
# Install MySQL 8.4+ and start the service
# Create database and user
mysql -u root -p

CREATE DATABASE bookingdb;
CREATE USER 'bookinguser'@'localhost' IDENTIFIED BY 'securepassword123';
GRANT ALL PRIVILEGES ON bookingdb.* TO 'bookinguser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (optional - defaults work)
echo "DB_HOST=localhost
DB_USER=bookinguser  
DB_PASS=securepassword123
DB_NAME=bookingdb
PORT=3000" > .env

# Run database migrations (auto-creates tables)
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies  
npm install

# No additional config needed - connects to localhost:3000
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
- Server runs on: http://localhost:3000
- API endpoints: http://localhost:3000/api/*
- Health check: http://localhost:3000/health

### Start Frontend (Terminal 2)  
```bash
cd frontend
npm run dev
```
- Frontend runs on: http://localhost:5173
- Auto-opens in browser

## Testing

### Backend Tests
```bash
cd backend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
- Overlap detection (parallel booking attempts)
- Idempotency (duplicate request handling)  
- Validation (required headers)

## API Endpoints

### Vendors
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id/availability?date=YYYY-MM-DD` - Get availability

### Bookings
- `POST /api/bookings` - Create booking (requires Idempotency-Key header)
- `GET /api/bookings/:id` - Get booking details


## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ using Node.js 20+, TypeScript, Express, Sequelize, React 19, Vite, and Tailwind CSS**
