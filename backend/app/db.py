from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# For SQLite, enable WAL mode and enforce foreign keys
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 15} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)

if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency for yielding database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables safely without dropping existing data."""
    # Import models here to register with Base.metadata
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    # Additive SQLite migration for existing local installs; never drops data.
    if "sqlite" in settings.DATABASE_URL:
        columns = {c["name"] for c in inspect(engine).get_columns("transactions")}
        additions = {
            "payment_status": "VARCHAR(30) NOT NULL DEFAULT 'unpaid'",
            "payment_reference": "VARCHAR(80)",
            "fulfilment_type": "VARCHAR(20)",
            "fulfilment_status": "VARCHAR(40) NOT NULL DEFAULT 'awaiting_payment'",
            "delivery_address": "VARCHAR(300)",
        }
        with engine.begin() as connection:
            for name, definition in additions.items():
                if name not in columns:
                    connection.execute(text(f"ALTER TABLE transactions ADD COLUMN {name} {definition}"))
