from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

_url = settings.sqlalchemy_database_url
connect_args = {"check_same_thread": False} if settings.is_sqlite else {}
# pool_pre_ping: drop dead Supabase/pooler connections instead of failing the next request
engine = create_engine(
    _url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=280 if not settings.is_sqlite else -1,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
