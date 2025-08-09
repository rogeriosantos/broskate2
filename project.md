# BroSkate Social Network - Complete Development Prompt

You are an expert full-stack developer tasked with creating **BroSkate**, a social network platform designed specifically for the
skateboarding community. This application connects skaters, skate shops, and skate spots in a unified ecosystem.

## Project Overview

**BroSkate** is a social network that:

- Connects skaters with local skate shops and communities
- Allows skate shops to create their own branded spaces
- Enables discovery and sharing of skate spots/parks
- Facilitates community building without complex registration barriers

## Core Features & User Stories

### Skater Profiles

- **No Registration Required**: Skaters can browse and discover content without signing up
- **Profile Creation**: Simple profile creation with basic info (username, location, skill level, favorite tricks)
- **Shop Membership**: Skaters can join multiple skate shop communities
- **Spot Contributions**: Add new skate spots/parks to the community map
- **Social Features**: Follow other skaters, share photos/videos of sessions

### Skate Shop Spaces

- **Shop Profiles**: Create branded shop spaces with info, location, events, team riders
- **Community Management**: Manage their local skater community
- **Event Posting**: Announce sessions, competitions, sales, new arrivals
- **Team Features**: Showcase sponsored riders and shop team

### Skate Points/Parks System

- **Spot Discovery**: Browse skate spots by location, type, difficulty
- **Community Contributions**: Registered users can add new spots
- **Spot Details**: Photos, difficulty ratings, features (rails, bowls, street elements)
- **Check-ins**: Skaters can check in when skating at spots

## Technical Stack Requirements

### Backend - Python FastAPI

- **Framework**: FastAPI with Python 3.11+
- **Database**: Raw SQL queries with asyncpg (NO ORM like SQLAlchemy)
- **Authentication**: JWT tokens for registered users, guest access for browsing
- **File Uploads**: Handle image/video uploads for profiles and spots
- **API Design**: RESTful API with proper HTTP status codes and response formatting
- **Database Connection**: Use connection pooling with asyncpg for Postgres

### Frontend - Next.js

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with custom skateboarding-themed design
- **State Management**: React Query/TanStack Query for server state, Zustand for client state
- **Authentication**: NextAuth.js or custom JWT handling
- **Image Handling**: Next.js Image component with optimization
- **Maps Integration**: Integrate mapping for skate spot discovery

### Mobile - React Native

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Query + Zustand (consistent with web)
- **Camera Integration**: Expo Camera for capturing skate content
- **Location Services**: Expo Location for spot discovery and check-ins
- **Maps**: React Native Maps for skate spot visualization

### Database - PostgreSQL on Neon.tech

- **Platform**: Neon.tech serverless Postgres
- **Schema Design**:
  - Users table (skaters)
  - Shops table
  - Skate_spots table
  - Shop_memberships table
  - Spot_contributions table
  - Posts/content tables
- **Indexing**: Proper indexes for location-based queries and user lookups
- **Connection**: Use connection string from Neon dashboard

### Deployment

- **Backend**: Docker container deployed on Railway
- **Frontend**: Vercel deployment with automatic builds from Git
- **Mobile**: Expo Go for development, Expo Build for production
- **Environment Variables**: Proper env var management across all platforms

## Database Schema Design

```sql
-- Core tables without ORM, using raw SQL

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    profile_image_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    favorite_tricks TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_guest BOOLEAN DEFAULT FALSE
);

CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_email VARCHAR(255),
    website_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skate_spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    spot_type VARCHAR(50) CHECK (spot_type IN ('park', 'street', 'bowl', 'vert', 'mini_ramp')),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    features TEXT[],
    image_urls TEXT[],
    added_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shop_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    shop_id INTEGER REFERENCES shops(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, shop_id)
);

CREATE TABLE spot_checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    spot_id INTEGER REFERENCES skate_spots(id),
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints Structure

### Authentication & Users

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/{user_id}` - Get public user profile

### Shops

- `GET /api/shops` - List all shops (with pagination and location filtering)
- `POST /api/shops` - Create shop (authenticated)
- `GET /api/shops/{shop_id}` - Get shop details
- `POST /api/shops/{shop_id}/join` - Join shop community
- `GET /api/shops/{shop_id}/members` - Get shop members

### Skate Spots

- `GET /api/spots` - List spots (with geo-filtering, pagination)
- `POST /api/spots` - Add new spot (authenticated users only)
- `GET /api/spots/{spot_id}` - Get spot details
- `POST /api/spots/{spot_id}/checkin` - Check in at spot
- `GET /api/spots/nearby` - Get spots near user location

## Implementation Guidelines

### Backend Development (FastAPI)

1. **Project Structure**:

   ```
   broskate-backend/
   ├── app/
   │   ├── main.py
   │   ├── database/
   │   │   ├── connection.py
   │   │   └── queries.py
   │   ├── routes/
   │   │   ├── auth.py
   │   │   ├── users.py
   │   │   ├── shops.py
   │   │   └── spots.py
   │   ├── models/
   │   │   └── schemas.py
   │   └── utils/
   │       ├── auth.py
   │       └── helpers.py
   ├── Dockerfile
   └── requirements.txt
   ```

2. **Key Implementation Points**:
   - Use Pydantic models for request/response validation
   - Implement proper error handling and logging
   - Add CORS middleware for frontend integration
   - Use asyncpg for database connections
   - Implement file upload handling for images
   - Add rate limiting for API endpoints

### Frontend Development (Next.js)

1. **Project Structure**:

   ```
   broskate-frontend/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   ├── shops/
   │   ├── spots/
   │   ├── profile/
   │   └── api/
   ├── components/
   │   ├── ui/
   │   ├── maps/
   │   └── skate/
   ├── lib/
   │   ├── api.ts
   │   └── auth.ts
   └── public/
   ```

2. **Key Features to Implement**:
   - Responsive design optimized for mobile-first
   - Interactive map component for spot discovery
   - Image upload and optimization
   - Real-time updates using React Query
   - Progressive Web App capabilities

### Mobile Development (React Native)

1. **Core Features**:

   - Native camera integration for capturing skate content
   - GPS location services for spot discovery
   - Push notifications for shop events and community updates
   - Offline capability for viewing cached spots
   - Social sharing integration

2. **Key Libraries**:
   - @react-navigation/native for navigation
   - @tanstack/react-query for API state management
   - expo-camera for camera functionality
   - expo-location for GPS services
   - react-native-maps for map integration

## Development Phases

### Phase 1: Core Infrastructure

1. Set up PostgreSQL database on Neon.tech
2. Create FastAPI backend with basic CRUD operations
3. Implement authentication system
4. Deploy backend to Railway with Docker
5. Set up Next.js frontend with basic routing
6. Connect frontend to backend API

### Phase 2: Core Features

1. Implement user profiles and guest browsing
2. Build shop creation and management system
3. Add skate spot discovery and contribution features
4. Implement shop membership functionality
5. Add basic social features (following, posting)

### Phase 3: Enhanced Features

1. Advanced spot filtering and search
2. Shop event management
3. Mobile app development with React Native
4. Real-time features (chat, live events)
5. Image/video upload and sharing

### Phase 4: Polish & Optimization

1. Performance optimization
2. Advanced mobile features (camera, GPS)
3. Push notifications
4. Analytics and monitoring
5. Community moderation tools

## Technical Considerations

### Security

- Implement proper input validation and sanitization
- Use JWT tokens with proper expiration
- Add rate limiting to prevent abuse
- Implement HTTPS in production
- Validate file uploads and implement size limits

### Performance

- Implement database indexing for location queries
- Use CDN for static assets and images
- Add caching layers (Redis if needed)
- Optimize bundle sizes for both web and mobile
- Implement lazy loading for images and content

### User Experience

- Design skateboarding-themed UI with street culture aesthetics
- Ensure fast load times and smooth animations
- Implement progressive disclosure for complex features
- Add haptic feedback on mobile for interactions
- Design for one-handed mobile usage

## Deployment Configuration

### Railway (Backend)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Vercel (Frontend)

- Configure for Next.js automatic deployment
- Set up environment variables for API endpoints
- Enable edge functions for optimal performance

### Expo (Mobile)

- Configure app.json for proper app metadata
- Set up EAS Build for production builds
- Configure push notification services

## Success Metrics

- User engagement (daily active users, session duration)
- Shop adoption (number of shops creating spaces)
- Spot contributions (new spots added by community)
- Community growth (shop memberships, user connections)
- Mobile app downloads and usage

---

**Important Notes for Implementation**:

- Start with MVP features and iterate based on user feedback
- Prioritize mobile experience as skaters are often on-the-go
- Ensure all location features work accurately for spot discovery
- Design with skateboarding culture in mind (authentic aesthetic, terminology)
- Plan for scalability as the skateboarding community can be very active and engaged

Begin implementation with Phase 1, focusing on solid infrastructure and core user flows before adding advanced features.
