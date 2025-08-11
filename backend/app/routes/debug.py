from fastapi import APIRouter
from app.database.connection import execute_single_query

router = APIRouter()

@router.get("/test-db")
async def test_database():
    """Test database connection"""
    try:
        # Simple query to test connection
        result = await execute_single_query("SELECT 1 as test")
        return {"status": "success", "result": dict(result) if result else None}
    except Exception as e:
        return {"status": "error", "error": str(e), "type": type(e).__name__}