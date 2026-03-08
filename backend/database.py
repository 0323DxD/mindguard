# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Use environment variable or default to local MariaDB for development
# Format: mysql+pymysql://<username>:<password>@<host>:<port>/<database_name>
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:1213@localhost:3307/mindguard"
)

# For MariaDB/MySQL, connect_args={"check_same_thread": False} is not needed.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True, # Recommended for MySQL to handle dropped connections
    pool_recycle=3600   # Avoid stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency hook to yield a DB session to FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
