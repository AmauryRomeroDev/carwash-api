from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# 1. Cargar el archivo .env explícitamente
load_dotenv()

# 2. Obtener valores con un respaldo (default) para evitar el error "None"
db_driver = os.getenv('DB_CONNECTION') 
db_user = os.getenv('DB_USERNAME')
db_pass = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT', '3306') 
db_name = os.getenv('DB_DATABASE')

DATABASE_URL = f"{db_driver}://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() # Asegúrate de llamar al método .close()
