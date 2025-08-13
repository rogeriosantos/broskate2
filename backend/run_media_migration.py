import asyncio
from app.database.connection import execute_command

async def run_migration():
    """Run media table migration"""
    
    # Create media table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video')),
        file_size INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('user', 'spot', 'shop', 'event')),
        entity_id INTEGER,
        category VARCHAR(20) NOT NULL DEFAULT 'gallery' CHECK (category IN ('profile', 'cover', 'gallery', 'thumbnail')),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by INTEGER NOT NULL,
        
        CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    )
    """
    
    await execute_command(create_table_sql)
    print('✅ Created media table')
    
    # Create indexes
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id)",
        "CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by)",
        "CREATE INDEX IF NOT EXISTS idx_media_upload_date ON media(upload_date)"
    ]
    
    for index_sql in indexes:
        await execute_command(index_sql)
        print(f'✅ Created index')
    
    print('✅ Media table migration completed successfully!')

if __name__ == "__main__":
    asyncio.run(run_migration())