import time
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# Engine configuration tailored for Neon PostgreSQL serverless pooling and SQLite fallback
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine_kwargs: Dict[str, Any] = {
    "echo": False,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Optimized pool settings for Neon serverless PostgreSQL
    engine_kwargs["pool_pre_ping"] = True      # Test connections before checkout (avoids stale serverless connections)
    engine_kwargs["pool_recycle"] = 300        # Recycle connections every 5 minutes
    engine_kwargs["pool_size"] = 10            # Base connection pool size
    engine_kwargs["max_overflow"] = 20         # Allowed burst connections

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request.
    Ensures sessions are cleanly closed when requests complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Dict[str, Any]:
    """
    Helper function to ping the database and return connectivity diagnostics.
    """
    start_time = time.time()
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            
            # Determine dialect
            dialect = engine.dialect.name
            
            return {
                "connected": result == 1,
                "dialect": dialect,
                "latency_ms": latency_ms,
                "database": "Neon PostgreSQL" if dialect == "postgresql" else dialect.capitalize(),
                "status": "healthy"
            }
    except Exception as exc:
        return {
            "connected": False,
            "status": "unhealthy",
            "error": str(exc),
            "latency_ms": round((time.time() - start_time) * 1000, 2)
        }
