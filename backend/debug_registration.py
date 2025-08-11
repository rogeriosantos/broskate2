#!/usr/bin/env python3
"""
Debug registration issue
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_registration_query():
    """Test the registration query"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found")
        return

    conn = await asyncpg.connect(database_url)
    
    try:
        # Set search path
        await conn.execute("SET search_path TO broskate, public")
        
        # Test the exact query from the registration
        query = """
        INSERT INTO users (username, email, password_hash, bio, location, skill_level, favorite_tricks)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, username, email, profile_image_url, bio, location, skill_level, 
                  favorite_tricks, created_at, is_guest
        """
        
        test_data = [
            "testuser_debug",
            "test@debug.com",
            "hashed_password_123",
            "Test bio",
            "Test location", 
            "beginner",
            ["kickflip", "ollie"]
        ]
        
        print("Testing registration query...")
        result = await conn.fetchrow(query, *test_data)
        print("SUCCESS: Query executed successfully")
        print(f"Result: {dict(result) if result else 'None'}")
        
        # Clean up test user
        await conn.execute("DELETE FROM users WHERE username = $1", "testuser_debug")
        print("Test user cleaned up")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_registration_query())