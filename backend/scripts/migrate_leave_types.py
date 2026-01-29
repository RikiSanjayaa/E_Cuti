"""
Migration script to:
1. Create leave_types table
2. Seed default leave types
3. Clean up existing data for fresh start
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from backend.core.database import engine, SessionLocal, Base
from backend import models

def migrate():
    print("=== Leave Type Migration ===")
    
    # 1. Drop existing tables and recreate schema
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating tables with new schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 2. Seed default leave types
        print("Seeding default leave types...")
        default_leave_types = [
            {"name": "Cuti Tahunan", "code": "cuti_tahunan", "default_quota": 12, "gender_specific": None},
            {"name": "Sakit", "code": "sakit", "default_quota": 14, "gender_specific": None},
            {"name": "Istimewa", "code": "istimewa", "default_quota": 8, "gender_specific": None},
            {"name": "Keagamaan", "code": "keagamaan", "default_quota": 5, "gender_specific": None},
            {"name": "Melahirkan", "code": "melahirkan", "default_quota": 90, "gender_specific": "P"},
            {"name": "Di Luar Tanggungan Negara", "code": "di_luar_tanggungan", "default_quota": 30, "gender_specific": None},
            {"name": "Alasan Penting", "code": "alasan_penting", "default_quota": 10, "gender_specific": None},
        ]
        
        for lt_data in default_leave_types:
            lt = models.LeaveType(**lt_data)
            db.add(lt)
        
        db.commit()
        print(f"Created {len(default_leave_types)} leave types")
        
        # 3. Seed default admin user
        print("Creating default admin user...")
        from backend.core.auth import get_password_hash
        
        admin = models.User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role="super_admin",
            full_name="Administrator",
            status="active"
        )
        db.add(admin)
        db.commit()
        print("Created admin user (username: admin, password: admin123)")
        
        print("\n=== Migration Complete ===")
        print("You can now run the seed_data.py script to populate sample data.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
