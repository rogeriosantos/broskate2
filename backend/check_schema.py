#!/usr/bin/env python3
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_schema_info():
    """Check what schemas and tables exist"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found")
        return

    conn = await asyncpg.connect(database_url)
    
    try:
        # Check current search path
        search_path = await conn.fetchval("SHOW search_path")
        print(f"Current search_path: {search_path}")
        
        # Check all schemas
        schemas = await conn.fetch("SELECT schema_name FROM information_schema.schemata ORDER BY schema_name")
        print(f"Available schemas: {[s['schema_name'] for s in schemas]}")
        
        # Check tables in public schema
        public_tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        print(f"Tables in public: {[t['table_name'] for t in public_tables]}")
        
        # Check tables in broskate schema
        broskate_tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'broskate' 
            AND table_type = 'BASE TABLE'
        """)
        print(f"Tables in broskate: {[t['table_name'] for t in broskate_tables]}")
        
        # Test simple query on public schema
        try:
            result = await conn.fetchval("SELECT 1")
            print(f"Simple query works: {result}")
        except Exception as e:
            print(f"Simple query failed: {e}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_schema_info())