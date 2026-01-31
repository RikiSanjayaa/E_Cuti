from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Determine if running in Docker
is_docker = os.path.exists("/.env")

raw_url = os.getenv("DATABASE_URL", "")

# Logic: Use SQLite if:
# 1. No DATABASE_URL is set
# 2. DATABASE_URL is set to the docker internal host (@db) but we are NOT in docker (local dev)
if not raw_url or ("@db" in raw_url and not is_docker):
    if "@db" in raw_url and not is_docker:
        print("[Database] Detected local environment with Docker URL. Falling back to local SQLite.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./polda_ntb.db"
else:
    SQLALCHEMY_DATABASE_URL = raw_url

# check_same_thread=False is needed for SQLite
connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
