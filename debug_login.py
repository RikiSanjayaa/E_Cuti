from backend.core.database import SessionLocal
from backend.models import User
from backend.core import auth

def test_login(username, password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User '{username}' NOT FOUND.")
            return

        print(f"User '{username}' FOUND.")
        print(f"Role: {user.role}")
        print(f"Hash in DB: {user.password_hash}")
        
        valid = auth.verify_password(password, user.password_hash)
        if valid:
            print(f"✅ Password '{password}' is CORRECT.")
        else:
            print(f"❌ Password '{password}' is INCORRECT.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_login("admin", "admin123")
