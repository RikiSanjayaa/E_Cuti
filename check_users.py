from backend.database import SessionLocal
from backend.models import User

try:
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Total users found: {len(users)}")
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}, Status: {u.status if hasattr(u, 'status') else 'No Status Field'}")
except Exception as e:
    print(f"Error: {e}")
