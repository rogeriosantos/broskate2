import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import asyncpg

logger = logging.getLogger(__name__)


def add_exception_handlers(app: FastAPI):
    """Add custom exception handlers to the FastAPI app"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions"""
        logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error": "HTTP_EXCEPTION"}
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors"""
        logger.warning(f"Validation error: {exc.errors()} - {request.url}")
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": exc.errors(),
                "error": "VALIDATION_ERROR"
            }
        )
    
    @app.exception_handler(asyncpg.PostgresError)
    async def database_exception_handler(request: Request, exc: asyncpg.PostgresError):
        """Handle database errors"""
        logger.error(f"Database error: {exc} - {request.url}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Database error occurred", 
                "error": "DATABASE_ERROR",
                "debug_info": str(exc)  # Always show for debugging
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        logger.error(f"Unexpected error: {exc} - {request.url}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred",
                "error": "INTERNAL_SERVER_ERROR", 
                "debug_info": f"{type(exc).__name__}: {str(exc)}"  # Show for debugging
            }
        )