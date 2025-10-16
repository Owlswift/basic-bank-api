# Bank API - Secure Banking System

A production-ready, secure banking API built with Node.js, Express, TypeScript, MongoDB, and Redis. This API provides user authentication, account management, and fund transfer capabilities with enterprise-grade security features.

## 🚀 Features

- **🔐 Secure Authentication**
  - JWT-based authentication with refresh tokens stored in Redis
  - Role-based access control (Customer & Admin roles)
  - Secure password hashing with bcrypt (12 rounds)
  - Automatic logout and token invalidation

- **🏦 Banking Operations**
  - User registration with automatic account creation
  - Secure fund transfers between accounts with validation
  - Complete transaction history
  - Real-time balance management

- **🛡️ Enterprise Security**
  - **Helmet.js** for comprehensive security headers
  - API rate limiting (different limits per endpoint)
  - Input validation with Joi schemas
  - CORS protection
  - Refresh token rotation mechanism
  - No SQL injection vulnerabilities (Mongoose ODM)

- **⚡ Production Ready**
  - TypeScript with strict type checking
  - SOLID principles with interface segregation
  - Manual dependency injection for testability
  - Comprehensive error handling
  - API versioning (v1)
  - Health check endpoints

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for token storage
- **Authentication**: JWT + Refresh Tokens
- **Security**: Helmet, CORS, bcryptjs, express-rate-limit
- **Validation**: Joi
- **Testing**: Jest + Supertest + MongoDB Memory Server
- **Code Quality**: ESLint, Prettier

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)

## 🚀 Quick Start

### 1. Installation & Setup

```bash
# Clone and setup
git clone <repository-url>
cd bank-api
npm install

# Environment setup
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` file:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/bank-api

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate strong secrets for production)
JWT_ACCESS_SECRET=your-super-secure-access-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Start Services

```bash
# Start MongoDB & Redis
brew services start mongodb-community
brew services start redis

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
docker run -d -p 6379:6379 --name redis redis:latest
```

### 4. Run the Application

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build && npm start

# Run tests
npm test
```

API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### 🔑 Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

#### Login
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

### 💰 Transfer Endpoints

#### Initiate Transfer
```http
POST /transfer/initiate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "toAccountNumber": "9876543210",
  "amount": 150.50,
  "description": "Dinner payment"
}
```

**Response:**
```json
{
  "message": "Transfer completed successfully",
  "transfer": {
    "reference": "uuid-reference",
    "amount": 150.50,
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get Transfer History
```http
GET /transfer/history
Authorization: Bearer <access_token>
```

### 👑 Admin Endpoints

#### Admin Dashboard
```http
GET /admin/dashboard
Authorization: Bearer <admin_access_token>
```

## 🏗 Architecture

### Dependency Injection Pattern
We use **manual constructor injection** following SOLID principles:

```typescript
// Service with injected dependencies
export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenRepository: ITokenRepository, 
    private accountRepository: IAccountRepository
  ) {}
}

// Repository pattern for data access
export class UserRepository implements IUserRepository {
  constructor(private userModel: Model<IUser>) {}
}
```

### Security Implementation

#### Helmet.js Security Headers
```typescript
this.app.use(helmet()); // Implements 11 security headers including:
// - Content Security Policy
// - Hide Powered-By
// - HSTS
// - No Sniff
// - XSS Protection
```

#### Rate Limiting
- **Authentication**: 5 requests per 15 minutes
- **Transfers**: 10 requests per hour  
- **General**: 100 requests per 15 minutes

#### JWT + Redis Flow
1. **Login**: Generate accessToken (15min) + refreshToken (7days)
2. **Storage**: Refresh token stored in Redis with user ID key
3. **Refresh**: Validate refresh token exists in Redis before issuing new tokens
4. **Logout**: Delete refresh token from Redis

## 🗄 Database Schema

### User Model
```typescript
{
  email: string;           // Unique, validated
  password: string;        // Hashed with bcrypt
  firstName: string;
  lastName: string; 
  role: 'customer' | 'admin';
  isActive: boolean;
}
```

### Account Model
```typescript
{
  accountNumber: string;   // 10-digit unique number
  userId: ObjectId;        // Reference to User
  balance: number;         // Minimum 0
  currency: string;        // Default: NGN
  isActive: boolean;
}
```

### Transfer Model
```typescript
{
  fromAccount: ObjectId;   // Sender account
  toAccount: ObjectId;     // Receiver account  
  amount: number;          // Minimum 0.01
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;       // UUID
  description?: string;
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test suite
npm test -- tests/integration/auth.test.ts
```

### Test Architecture
- **Unit Tests**: Service & repository layer with mocked dependencies
- **Integration Tests**: Full API testing with in-memory MongoDB
- **Test Coverage**: 80%+ coverage across all critical paths

## 🔧 Development

### Project Structure
```
src/
├── config/          # Database & Redis configuration
├── entities/        # MongoDB models with TypeScript
├── interfaces/      # Contract definitions
├── repositories/    # Data access layer
├── services/        # Business logic with DI
├── controllers/     # HTTP request handlers
├── middleware/      # Auth, validation, rate limiting
├── routes/          # API route definitions (v1)
├── types/           # TypeScript definitions
└── utils/           # Helper functions
```

### Code Quality
- TypeScript with strict mode enabled
- ESLint + Prettier configuration
- SOLID principles adherence
- Interface segregation for clear contracts

## 🚨 Error Handling

Consistent error responses across all endpoints:

```json
{
  "error": "Descriptive error message"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 📊 Monitoring

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 🔒 Security Best Practices

1. **Never store tokens in localStorage** - Use httpOnly cookies in production
2. **Rotate JWT secrets regularly** in production environments
3. **Use HTTPS only** in production
4. **Implement IP whitelisting** for admin endpoints
5. **Add request logging** and monitoring
6. **Regular security audits** and dependency updates

## 🚀 Deployment

```bash
# Production build
npm run build

# Start production server
npm start

# Environment variables for production
NODE_ENV=production
MONGODB_URI=your_production_mongodb_url
REDIS_URL=your_production_redis_url
JWT_ACCESS_SECRET=strong_production_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- 📚 Check API documentation above
- 🐛 Create GitHub issues for bugs
- 💬 Discussions for questions and ideas

---

**Built with security and scalability in mind using modern TypeScript and enterprise patterns.**# basic-bank-api
