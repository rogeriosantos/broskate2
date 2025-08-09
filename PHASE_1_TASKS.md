# Phase 1: Core Infrastructure - Detailed Tasks

## Week 1: Database & Backend Foundation

### Task 1.1: Database Setup (2 days)
- [ ] Create Neon.tech account and project
- [ ] Set up PostgreSQL database with connection pooling
- [ ] Create all database tables from schema:
  - [ ] users table with constraints
  - [ ] shops table with location indexing  
  - [ ] skate_spots table with geo-indexing
  - [ ] shop_memberships table with unique constraints
  - [ ] spot_checkins table
- [ ] Create database indexes for performance:
  - [ ] Location-based indexes (latitude, longitude)
  - [ ] User lookup indexes (email, username)
  - [ ] Shop membership queries
- [ ] Test database connection and basic queries

### Task 1.2: FastAPI Backend Setup (3 days)
- [ ] Initialize FastAPI project with proper structure
- [ ] Set up asyncpg connection pooling
- [ ] Create Pydantic models for all entities:
  - [ ] User schemas (create, update, response)
  - [ ] Shop schemas
  - [ ] Spot schemas  
  - [ ] Authentication schemas
- [ ] Implement database connection management:
  - [ ] Connection pool configuration
  - [ ] Database query utilities
  - [ ] Error handling for DB operations
- [ ] Create basic CRUD operations (raw SQL only):
  - [ ] User operations
  - [ ] Shop operations
  - [ ] Spot operations
- [ ] Add middleware:
  - [ ] CORS middleware
  - [ ] Request logging
  - [ ] Error handling middleware

## Week 2: Authentication & API Development

### Task 2.1: Authentication System (3 days)
- [ ] Implement JWT token system:
  - [ ] Token generation and validation
  - [ ] Token refresh mechanism
  - [ ] Secure token storage guidelines
- [ ] Create authentication routes:
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/refresh
  - [ ] POST /api/auth/logout
- [ ] Implement guest access system:
  - [ ] Guest browsing without tokens
  - [ ] Feature restrictions for guests
  - [ ] Guest to user conversion flow
- [ ] Add password hashing with bcrypt
- [ ] Implement authentication decorators/dependencies

### Task 2.2: Core API Endpoints (2 days)
- [ ] User management endpoints:
  - [ ] GET /api/users/profile (authenticated)
  - [ ] PUT /api/users/profile (authenticated)
  - [ ] GET /api/users/{user_id} (public)
- [ ] Shop endpoints:
  - [ ] GET /api/shops (with pagination)
  - [ ] POST /api/shops (authenticated)
  - [ ] GET /api/shops/{shop_id}
- [ ] Spot endpoints:
  - [ ] GET /api/spots (with geo-filtering)
  - [ ] POST /api/spots (authenticated)
  - [ ] GET /api/spots/{spot_id}
- [ ] Add proper HTTP status codes and error responses
- [ ] Implement request validation with Pydantic

## Week 3: Deployment & Frontend Setup

### Task 3.1: Backend Deployment (2 days)
- [ ] Create Dockerfile for FastAPI app
- [ ] Set up Railway project and deployment
- [ ] Configure environment variables:
  - [ ] Database connection string
  - [ ] JWT secret key
  - [ ] CORS origins
- [ ] Test deployed backend endpoints
- [ ] Set up monitoring and logging
- [ ] Configure automatic deployments from Git

### Task 3.2: Next.js Frontend Foundation (3 days)
- [ ] Initialize Next.js 14+ project with App Router
- [ ] Configure Tailwind CSS with skateboarding theme:
  - [ ] Custom color palette
  - [ ] Typography system
  - [ ] Component base styles
- [ ] Set up project structure:
  - [ ] app/ directory with routing
  - [ ] components/ directory organization
  - [ ] lib/ directory for utilities
- [ ] Configure API client:
  - [ ] Axios setup with interceptors
  - [ ] Base URL configuration
  - [ ] Error handling
- [ ] Set up state management:
  - [ ] TanStack Query configuration
  - [ ] Zustand store setup
  - [ ] Auth state management

### Task 3.3: Frontend Deployment & Integration (2 days)
- [ ] Deploy to Vercel with environment variables
- [ ] Connect frontend to deployed backend
- [ ] Test API integration end-to-end
- [ ] Set up automatic deployments from Git
- [ ] Configure domain and SSL (if applicable)

## Acceptance Criteria for Phase 1

### Technical Requirements:
✅ Database schema fully implemented and indexed  
✅ FastAPI backend deployed and accessible  
✅ All authentication flows working  
✅ Next.js frontend deployed and connected  
✅ CI/CD pipeline functional  

### Performance Requirements:
✅ API response times <200ms for basic queries  
✅ Database connection pooling working  
✅ Frontend loads in <3 seconds  

### Security Requirements:
✅ JWT tokens properly implemented  
✅ Password hashing with bcrypt  
✅ CORS configured correctly  
✅ Input validation on all endpoints  

## Dependencies & Blockers

### External Dependencies:
- Neon.tech account approval and setup
- Railway deployment account
- Vercel deployment account
- Domain registration (optional)

### Technical Dependencies:
- PostgreSQL schema finalization
- Environment variable configuration
- SSL certificate setup

## Estimated Effort: 21 days total
- Database Setup: 2 days
- Backend Development: 5 days  
- Deployment Setup: 4 days
- Frontend Foundation: 5 days
- Integration & Testing: 3 days
- Buffer/Documentation: 2 days