import asyncpg
import os
from typing import Optional
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_db():
    """Initialize database connection pool"""
    global _pool
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    try:
        _pool = await asyncpg.create_pool(
            database_url,
            min_size=5,
            max_size=20,
            command_timeout=60,
            server_settings={
                "jit": "off",
                "search_path": "broskate, public"
            }
        )
        logger.info("Database connection pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise


async def close_db():
    """Close database connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        logger.info("Database connection pool closed")


def get_pool() -> asyncpg.Pool:
    """Get the database connection pool"""
    if not _pool:
        raise RuntimeError("Database pool not initialized")
    return _pool


@asynccontextmanager
async def get_db_connection():
    """Context manager for database connections"""
    pool = get_pool()
    async with pool.acquire() as connection:
        yield connection


async def execute_query(query: str, *args):
    """Execute a query and return results"""
    async with get_db_connection() as conn:
        return await conn.fetch(query, *args)


async def execute_single_query(query: str, *args):
    """Execute a query and return single result"""
    async with get_db_connection() as conn:
        return await conn.fetchrow(query, *args)


async def execute_command(query: str, *args):
    """Execute a command (INSERT, UPDATE, DELETE)"""
    async with get_db_connection() as conn:
        return await conn.execute(query, *args)