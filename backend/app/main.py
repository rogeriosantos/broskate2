from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from app.database.connection import init_db, close_db
from app.routes import auth, users, shops, spots
from app.middleware.error_handler import add_exception_handlers
from app.middleware.logging import add_logging_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="BroSkate API",
    description="Social network API for the skateboarding community",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
add_logging_middleware(app)
add_exception_handlers(app)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(shops.router, prefix="/api/shops", tags=["shops"])
app.include_router(spots.router, prefix="/api/spots", tags=["spots"])


@app.get("/")
async def root():
    return {"message": "BroSkate API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}