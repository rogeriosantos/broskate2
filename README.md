# BroSkate - Skateboarding Social Network

A social network platform designed specifically for the skateboarding community. BroSkate connects skaters with local skate shops and communities, enables discovery and sharing of skate spots/parks, and facilitates community building.

## 🏗️ Architecture

- **Backend**: FastAPI with Python 3.11+ and PostgreSQL
- **Frontend**: Next.js 14+ with Tailwind CSS
- **Mobile**: React Native with Expo (Phase 3)
- **Database**: PostgreSQL on Neon.tech
- **Deployment**: Railway (backend), Vercel (frontend)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database (Neon.tech recommended)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Run the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL and Mapbox token

# Run the development server
npm run dev
```

### Database Setup

1. Create a PostgreSQL database on [Neon.tech](https://neon.tech)
2. Run the database schema:
   ```bash
   psql "your-database-url" -f database_schema.sql
   ```

## 📋 Development Status

### ✅ Phase 1: Core Infrastructure (COMPLETED)
- [x] PostgreSQL database with complete schema
- [x] FastAPI backend with authentication
- [x] Next.js frontend with Tailwind CSS
- [x] State management (TanStack Query + Zustand)
- [x] Docker containerization
- [x] Deployment configuration

### 🏗️ Phase 2: Core Features (NEXT)
- [ ] User profile system with guest browsing
- [ ] Shop creation and management
- [ ] Skate spot discovery with maps
- [ ] Shop membership functionality
- [ ] Basic social features

## 🔧 Development Commands

### Backend
```bash
# Run tests
pytest

# Format code
black app/
isort app/

# Type checking
mypy app/
```

### Frontend
```bash
# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
broskate2/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Pydantic schemas
│   │   ├── database/       # Database connection
│   │   ├── utils/          # Utilities (auth, helpers)
│   │   └── middleware/     # Custom middleware
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and stores
│   └── public/             # Static assets
├── docs/                   # Documentation
│   ├── architecture/       # System design docs
│   ├── api/               # API documentation
│   └── development/       # Dev guides
└── database_schema.sql     # Database schema
```

## 🎯 Core Features

### For Skaters
- ✅ No registration required for browsing
- ✅ Create profiles with skill level and favorite tricks
- ✅ Join multiple skate shop communities
- ✅ Add new skate spots to the community map
- ✅ Social features (follow other skaters, share content)

### For Skate Shops  
- ✅ Create branded shop spaces
- ✅ Manage local skater community
- ✅ Post events, competitions, sales, and sessions
- ✅ Showcase sponsored riders and shop team

### Skate Spots System
- ✅ Browse spots by location, type, and difficulty
- ✅ Community-contributed spot database
- ✅ Detailed spot info with photos and features
- ✅ Check-in system for tracking sessions

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
SECRET_KEY=your-super-secret-jwt-key
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-access-token
NODE_ENV=development
```

## 🚀 Deployment

### Backend (Railway)
1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically build and deploy using the Dockerfile

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Vercel will automatically build and deploy the Next.js app

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI generation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏁 Getting Started

Ready to start developing? Check out our [Development Sequence Guide](DEVELOPMENT_SEQUENCE.md) for the optimal development order and [Phase 1 Tasks](PHASE_1_TASKS.md) for detailed implementation steps.