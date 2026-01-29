"""
Unified Database Management CLI for E-Cuti

Usage:
  python -m backend.scripts.manage <command>

Commands:
  init   - Initialize database (create tables, leave types, admin user)
  fresh  - Drop all data and start fresh with seed data (for development)
  seed   - Add dummy data to existing database
  reset  - Clear operational data but keep users and leave types
  check  - Show database status and counts
"""
import sys
import os
import argparse

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from passlib.context import CryptContext
from backend.core.database import engine, SessionLocal, Base
from backend import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Default leave types with colors
DEFAULT_LEAVE_TYPES = [
    {"name": "Cuti Tahunan", "code": "cuti_tahunan", "default_quota": 12, "gender_specific": None, "color": "blue"},
    {"name": "Sakit", "code": "sakit", "default_quota": 14, "gender_specific": None, "color": "red"},
    {"name": "Istimewa", "code": "istimewa", "default_quota": 8, "gender_specific": None, "color": "indigo"},
    {"name": "Keagamaan", "code": "keagamaan", "default_quota": 5, "gender_specific": None, "color": "teal"},
    {"name": "Melahirkan", "code": "melahirkan", "default_quota": 90, "gender_specific": "P", "color": "orange"},
    {"name": "Di Luar Tanggungan Negara", "code": "di_luar_tanggungan", "default_quota": 30, "gender_specific": None, "color": "slate"},
    {"name": "Alasan Penting", "code": "alasan_penting", "default_quota": 10, "gender_specific": None, "color": "purple"},
]


def cmd_init():
    """Initialize database: create tables, leave types, and admin user."""
    print("=" * 50)
    print("  DATABASE INITIALIZATION")
    print("=" * 50)
    
    # Create all tables
    print("\n[1/3] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("      Tables created successfully.")
    
    db = SessionLocal()
    try:
        # Seed leave types if not exist
        print("\n[2/3] Setting up leave types...")
        existing_count = db.query(models.LeaveType).count()
        if existing_count > 0:
            print(f"      Leave types already exist ({existing_count} found). Skipping.")
        else:
            for lt_data in DEFAULT_LEAVE_TYPES:
                lt = models.LeaveType(**lt_data)
                db.add(lt)
            db.commit()
            print(f"      Created {len(DEFAULT_LEAVE_TYPES)} leave types.")
        
        # Create admin user if not exist
        print("\n[3/3] Setting up admin user...")
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if admin:
            print("      Admin user already exists. Skipping.")
        else:
            admin = models.User(
                username="admin",
                password_hash=pwd_context.hash("admin123"),
                role="super_admin",
                full_name="Administrator",
                status="active"
            )
            db.add(admin)
            db.commit()
            print("      Created admin user.")
            print("      -> Username: admin")
            print("      -> Password: admin123")
        
        print("\n" + "=" * 50)
        print("  INITIALIZATION COMPLETE")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
        raise
    finally:
        db.close()


def cmd_fresh():
    """Drop all tables and start fresh with seed data."""
    print("=" * 50)
    print("  FRESH DATABASE RESET")
    print("=" * 50)
    print("\n[WARNING] This will DELETE all existing data!")
    
    # Drop all tables
    print("\n[1/4] Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("      All tables dropped.")
    
    # Create tables
    print("\n[2/4] Creating fresh tables...")
    Base.metadata.create_all(bind=engine)
    print("      Tables created.")
    
    db = SessionLocal()
    try:
        # Seed leave types
        print("\n[3/4] Seeding leave types...")
        for lt_data in DEFAULT_LEAVE_TYPES:
            lt = models.LeaveType(**lt_data)
            db.add(lt)
        db.commit()
        print(f"      Created {len(DEFAULT_LEAVE_TYPES)} leave types.")
        
        # Create admin user
        print("\n[4/4] Creating admin user...")
        admin = models.User(
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            role="super_admin",
            full_name="Administrator",
            status="active"
        )
        db.add(admin)
        db.commit()
        print("      Admin user created.")
        print("      -> Username: admin")
        print("      -> Password: admin123")
        
        print("\n" + "=" * 50)
        print("  FRESH RESET COMPLETE")
        print("=" * 50)
        print("\nRun 'npm run db:seed' to add dummy data for testing.")
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
        raise
    finally:
        db.close()


def cmd_seed():
    """Add dummy data for development/testing."""
    print("=" * 50)
    print("  SEEDING DUMMY DATA")
    print("=" * 50)
    
    import random
    from datetime import date, timedelta, datetime
    
    db = SessionLocal()
    
    try:
        # Check leave types exist
        leave_types = db.query(models.LeaveType).filter(models.LeaveType.is_active == True).all()
        if not leave_types:
            print("\n[ERROR] No leave types found. Run 'npm run db:init' first!")
            db.close()
            return
        
        leave_type_map = {lt.code: lt for lt in leave_types}
        
        # 1. Seed Personnel
        print("\n[1/3] Seeding Personnel...")
        if db.query(models.Personnel).count() > 0:
            print("      Personnel already exists. Skipping.")
            personnels = db.query(models.Personnel).all()
        else:
            ranks = ["Bripda", "Briptu", "Brigadir", "Bripka", "Aipda", "Aiptu", "Ipda", "Iptu", "AKP", "Kompol", "AKBP", "Kombes"]
            jabatan_list = ["Anggota", "Kanit", "Kasubnit", "Pamin", "Kaur", "Kabag", "Kasat"]
            
            names_male = [
                ("Adi Pratama", "L"), ("Budi Santoso", "L"), ("Dedi Kurniawan", "L"), 
                ("Eko Prasetyo", "L"), ("Fajar Nugroho", "L"), ("Hadi Sucipto", "L"), 
                ("Joko Susilo", "L"), ("Muhamad Rizky", "L"), ("Oki Saputra", "L"), 
                ("Slamet Riyadi", "L")
            ]
            names_female = [
                ("Citra Dewi", "P"), ("Gita Pertiwi", "P"), ("Indah Sari", "P"), 
                ("Kiki Amalia", "P"), ("Lina Wati", "P"), ("Nurul Hidayah", "P"), 
                ("Putri Ayu", "P"), ("Qori Ahlam", "P"), ("Rini Suharti", "P"), 
                ("Tri Wahyuni", "P")
            ]
            
            names = names_male + names_female
            personnels = []
            
            for i, (name, gender) in enumerate(names):
                p = models.Personnel(
                    nrp=f"8501{1000+i}",
                    nama=name,
                    pangkat=random.choice(ranks),
                    jabatan=random.choice(jabatan_list),
                    jenis_kelamin=gender
                )
                db.add(p)
                personnels.append(p)
            
            db.commit()
            for p in personnels:
                db.refresh(p)
            print(f"      Created {len(personnels)} personnel records.")
        
        # 2. Seed Leave History
        print("\n[2/3] Seeding Leave History...")
        admin = db.query(models.User).filter(models.User.role == "super_admin").first()
        admin_id = admin.id if admin else 1
        
        if db.query(models.LeaveHistory).count() > 5:
            print("      Leave history already populated. Skipping.")
        else:
            general_leave_types = ['cuti_tahunan', 'sakit', 'istimewa', 'alasan_penting', 'keagamaan']
            reasons = ["Acara Keluarga", "Sakit Demam", "Menikah", "Ibadah Umroh", "Urusan Mendesak", "Istirahat"]
            today = date.today()
            
            # Past leaves for reports
            for _ in range(50):
                p = random.choice(personnels)
                days = random.randint(1, 5)
                start_date = today - timedelta(days=random.randint(0, 120))
                
                if p.jenis_kelamin == 'P' and random.random() < 0.1:
                    lt_code = 'melahirkan'
                    days = random.randint(30, 90)
                else:
                    lt_code = random.choice(general_leave_types)
                
                leave_type = leave_type_map.get(lt_code)
                if not leave_type:
                    continue
                
                leave = models.LeaveHistory(
                    personnel_id=p.id,
                    leave_type_id=leave_type.id,
                    jumlah_hari=days,
                    tanggal_mulai=start_date,
                    alasan=random.choice(reasons),
                    created_by=admin_id,
                    created_at=datetime.combine(start_date, datetime.min.time())
                )
                db.add(leave)
            
            # Active leaves
            for _ in range(5):
                p = random.choice(personnels)
                days = random.randint(3, 7)
                start_date = today - timedelta(days=random.randint(0, days-1))
                
                lt_code = random.choice(general_leave_types)
                leave_type = leave_type_map.get(lt_code)
                if not leave_type:
                    continue
                
                leave = models.LeaveHistory(
                    personnel_id=p.id,
                    leave_type_id=leave_type.id,
                    jumlah_hari=days,
                    tanggal_mulai=start_date,
                    alasan="Sedang Cuti (Active)",
                    created_by=admin_id,
                    created_at=datetime.now()
                )
                db.add(leave)
            
            db.commit()
            print("      Created 55 leave history records.")
        
        # 3. Seed Audit Logs
        print("\n[3/3] Seeding Audit Logs...")
        if db.query(models.AuditLog).count() > 0:
            print("      Audit logs already exist. Skipping.")
        else:
            from datetime import datetime
            actions = [
                ("LOGIN", "Authentication", "admin", "User", "Successful login to system"),
                ("CREATE_USER", "User Management", "atasan", "User", "Created new user"),
                ("INPUT_IZIN", "Leave Management", "85011005", "Personnel", "Input izin for NRP 85011005"),
                ("UPDATE_SETTING", "System Configuration", "System", "Config", "System security check"),
            ]
            
            for action, cat, target, t_type, detail in actions:
                log = models.AuditLog(
                    user_id=admin_id,
                    action=action,
                    category=cat,
                    target=target,
                    target_type=t_type,
                    details=detail,
                    status="success",
                    timestamp=datetime.now() - timedelta(minutes=random.randint(60, 10000))
                )
                db.add(log)
            db.commit()
            print("      Created 4 audit log entries.")
        
        print("\n" + "=" * 50)
        print("  SEEDING COMPLETE")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
        raise
    finally:
        db.close()


def cmd_reset():
    """Clear operational data but keep users and leave types."""
    print("=" * 50)
    print("  RESETTING OPERATIONAL DATA")
    print("=" * 50)
    print("\nThis will clear: Leave History, Audit Logs, Personnel")
    print("This will KEEP: Users, Leave Types\n")
    
    db = SessionLocal()
    try:
        print("[1/3] Clearing Leave History...")
        count = db.query(models.LeaveHistory).delete()
        print(f"      Deleted {count} records.")
        
        print("[2/3] Clearing Audit Logs...")
        count = db.query(models.AuditLog).delete()
        print(f"      Deleted {count} records.")
        
        print("[3/3] Clearing Personnel...")
        count = db.query(models.Personnel).delete()
        print(f"      Deleted {count} records.")
        
        db.commit()
        
        print("\n" + "=" * 50)
        print("  RESET COMPLETE")
        print("=" * 50)
        print("\nUsers and Leave Types have been preserved.")
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
    finally:
        db.close()


def cmd_check():
    """Show database status and record counts."""
    print("=" * 50)
    print("  DATABASE STATUS")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        print("\n  Table Counts:")
        print(f"    Users:         {db.query(models.User).count()}")
        print(f"    Leave Types:   {db.query(models.LeaveType).count()}")
        print(f"    Personnel:     {db.query(models.Personnel).count()}")
        print(f"    Leave History: {db.query(models.LeaveHistory).count()}")
        print(f"    Audit Logs:    {db.query(models.AuditLog).count()}")
        
        print("\n  Users:")
        users = db.query(models.User).all()
        for u in users:
            status = getattr(u, 'status', 'N/A')
            print(f"    - {u.username} ({u.role}) [{status}]")
        
        print("\n  Leave Types:")
        leave_types = db.query(models.LeaveType).all()
        for lt in leave_types:
            active = "active" if lt.is_active else "inactive"
            print(f"    - {lt.name} ({lt.code}) [{active}]")
        
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="E-Cuti Database Management CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  init   - Initialize database (first-time setup)
  fresh  - Drop all and start fresh (development reset)
  seed   - Add dummy data for testing
  reset  - Clear operational data (keep users & leave types)
  check  - Show database status
        """
    )
    parser.add_argument('command', choices=['init', 'fresh', 'seed', 'reset', 'check'],
                        help='Command to execute')
    
    args = parser.parse_args()
    
    commands = {
        'init': cmd_init,
        'fresh': cmd_fresh,
        'seed': cmd_seed,
        'reset': cmd_reset,
        'check': cmd_check,
    }
    
    commands[args.command]()


if __name__ == "__main__":
    main()
