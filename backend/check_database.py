#!/usr/bin/env python3
"""
Database checker script to verify tables exist and create them if missing
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_database():
    """Check if database tables exist and create them if missing"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment")
        return False
        
    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)
        print("SUCCESS: Connected to database")
        
        # Check if tables exist in both public and broskate schemas
        tables_query = """
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'broskate')
        AND table_type = 'BASE TABLE';
        """
        
        tables = await conn.fetch(tables_query)
        existing_tables = [table['table_name'] for table in tables]
        broskate_tables = [table['table_name'] for table in tables if table['table_schema'] == 'broskate']
        
        expected_tables = ['users', 'shops', 'skate_spots', 'shop_memberships', 'spot_checkins']
        
        print(f"All existing tables: {existing_tables}")
        print(f"BroSkate schema tables: {broskate_tables}")
        print(f"Expected tables: {expected_tables}")
        
        missing_tables = [table for table in expected_tables if table not in broskate_tables]
        
        if missing_tables:
            print(f"MISSING from broskate schema: {missing_tables}")
            print("SOLUTION: Run database_schema.sql to create missing tables")
            return False
        else:
            print("SUCCESS: All required tables exist in broskate schema")
            
            # Test a simple query (using broskate schema)
            await conn.execute("SET search_path TO broskate, public")
            user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            print(f"Users in database: {user_count}")
            
            return True
            
    except Exception as e:
        print(f"ERROR: Database error: {e}")
        return False
    finally:
        if 'conn' in locals():
            await conn.close()

async def create_tables():
    """Create database tables from schema file"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found")
        return False
        
    try:
        # Read schema file
        schema_path = "../database_schema.sql"
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            
        conn = await asyncpg.connect(database_url)
        
        # Execute schema
        await conn.execute(schema_sql)
        print("SUCCESS: Database tables created successfully")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"ERROR: Error creating tables: {e}")
        return False

if __name__ == "__main__":
    print("Checking database status...")
    
    # Check if tables exist
    tables_exist = asyncio.run(check_database())
    
    if not tables_exist:
        print("\nCreating database tables...")
        created = asyncio.run(create_tables())
        
        if created:
            print("\nRe-checking database...")
            asyncio.run(check_database())