from .database import engine, SessionLocal
from .models import Base, User, Role, Personnel
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if super admin exists
    if not db.query(User).filter(User.username == "admin").first():
        admin_user = User(
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            role=Role.super_admin,
            full_name="Super Administrator"
        )
        db.add(admin_user)
        print("Super Admin created.")

    # Check if atasan exists
    if not db.query(User).filter(User.username == "atasan").first():
        atasan_user = User(
            username="atasan",
            password_hash=pwd_context.hash("atasan123"),
            role=Role.atasan,
            full_name="Atasan Polda"
        )
        db.add(atasan_user)
        print("Atasan user created.")

    db.commit()
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialized successfully.")
