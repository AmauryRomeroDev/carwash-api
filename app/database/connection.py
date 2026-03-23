from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os


DATABASE_URL = (
    f"{os.getenv('DB_CONNECTION')}://"
    f"{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_DATABASE')}"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal= sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base= declarative_base()

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close