from sqlalchemy.orm import Session
from backend.core.database import SessionLocal, engine
from backend import models
from sqlalchemy import text

def reset_database():
    db = SessionLocal()
    try:
        print("Clearing LeaveHistory...")
        db.query(models.LeaveHistory).delete()
        
        print("Clearing AuditLog...")
        db.query(models.AuditLog).delete()
        
        print("Clearing Personnel (Dummy Data)...")
        db.query(models.Personnel).delete()
        
        # Do not delete Users (Admin/Atasan)
        
        db.commit()
        print("Database cleared successfully (Users retained).")
        
        # VACUUM to reclaim space (optional for sqlite)
        # db.execute(text("VACUUM"))
        
    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
