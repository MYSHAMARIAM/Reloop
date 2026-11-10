from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.db import init_db
from app.routes.auth_routes import router as auth_router
from app.routes.listings_routes import router as listings_router
from app.routes.bids_routes import router as bids_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.transactions_routes import router as transactions_router
from app.seed_demo import seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe startup initialization
    init_db()
    # Auto-seed demo data if fresh development database
    if settings.DEBUG:
        try:
            seed()
        except Exception as e:
            print(f"Demo seed notice: {e}")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Reloop: Campus Auction House",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration restricted to local development origins
app.add_middleware(
    CORSMiddleware,
    # We MUST list the exact origins, we cannot use "*" with credentials
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000" # Just in case your Vite port is different
    ], 
    allow_credentials=True,  # CRITICAL: This tells the browser to accept cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Validation exception handler for clean error responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    errors = []

    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        errors.append(f"{field}: {error.get('msg')}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "; ".join(errors),
            "errors": [
                {
                    "field": ".".join(str(loc) for loc in error.get("loc", [])),
                    "message": error.get("msg", "Invalid value"),
                    "type": error.get("type", "validation_error"),
                }
                for error in exc.errors()
            ],
        },
    )

# Health check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }

# Include all route blueprints under /api
app.include_router(auth_router, prefix="/api")
app.include_router(listings_router, prefix="/api")
app.include_router(bids_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
