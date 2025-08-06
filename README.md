# Social Backend API

## 📋 Description

Backend API cho ứng dụng Social Network được xây dựng bằng [NestJS] framework với TypeScript.

## 🚀 Installation

### Prerequisites

- Node.js (version 20 or higher)
- npm or yarn
- Git

### Setup Project

```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
npm install
# hoặc
yarn install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
# hoặc
yarn dev
```

## 📁 Project Structure

```
backend/
├── 📁 src/                          # Source code chính
│   ├── 📁 modules/                  # Các module của ứng dụng
│   ├── 📁 services/                 # Business logic services
│   ├── 📁 utils/                    # Utility functions và helpers
│   ├── 📁 config/                   # Configuration files
│   ├── 📁 types/                    # TypeScript type definitions
│   ├── app.controller.ts            # Main application controller
│   ├── app.module.ts                # Root application module
│   └── main.ts                      # Application entry point
├── 📁 test/                         # Test files
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── .prettierrc                      # Prettier configuration
├── .prettierignore                  # Prettier ignore rules
├── eslint.config.mjs                # ESLint configuration
├── nest-cli.json                    # NestJS CLI configuration
├── package.json                     # Project dependencies và scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.build.json              # TypeScript build configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run start:dev                    # Start development server with hot reload
npm run start:debug                  # Start with debug mode

# Production
npm run build                        # Build project for production
npm run start:prod                   # Start production server

# Testing
npm run test                         # Run unit tests
npm run test:watch                   # Run tests in watch mode
npm run test:cov                     # Run tests with coverage
npm run test:e2e                     # Run end-to-end tests

# Code Quality
npm run lint                         # Run ESLint
npm run lint:fix                     # Fix ESLint errors
npm run format                       # Format code with Prettier
npm run format:check                 # Check code formatting
npm run format:all                   # Format all files

# Database
npm run migration:generate           # Generate new migration
npm run migration:run                # Run pending migrations
npm run migration:revert             # Revert last migration
```

## 🔧 Configuration

### Environment Variables

Tạo file `.env` từ `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/social_db

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880
```

### Database Setup

```bash
# Install PostgreSQL
# Create database
createdb social_db

# Run migrations
npm run migration:run
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📚 API Documentation

API documentation được tạo tự động bằng Swagger:

- **Development**: http://localhost:3000/api/docs
- **Production**: https://your-domain.com/api/docs

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t social-backend .

# Run container
docker run -p 3000:3000 social-backend
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

Dự án sử dụng:

- **Prettier** cho code formatting
- **ESLint** cho code linting
- **TypeScript** cho type safety

Format code tự động khi save (VS Code settings đã được cấu hình).
