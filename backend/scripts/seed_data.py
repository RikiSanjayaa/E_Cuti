"""
Seed script to populate dummy data for development/testing.
Run migrate_leave_types.py first to set up the schema and leave types.
"""
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend import models
import random
from datetime import date, timedelta, datetime

def seed_data():
    db = SessionLocal()
    
    # Check if leave types exist (migration must run first)
    leave_types = db.query(models.LeaveType).filter(models.LeaveType.is_active == True).all()
    if not leave_types:
        print("ERROR: No leave types found. Run migrate_leave_types.py first!")
        db.close()
        return
    
    # Build a map for easy lookup
    leave_type_map = {lt.code: lt for lt in leave_types}
    
    # 1. Seed Personnel
    if db.query(models.Personnel).count() > 0:
        print("Data personnel already exists. Skipping personnel seed.")
        personnels = db.query(models.Personnel).all()
    else:
        print("Seeding Personnel...")
        ranks = ["Bripda", "Briptu", "Brigadir", "Bripka", "Aipda", "Aiptu", "Ipda", "Iptu", "AKP", "Kompol", "AKBP", "Kombes"]
        jabatan_list = ["Anggota", "Kanit", "Kasubnit", "Pamin", "Kaur", "Kabag", "Kasat"]
        
        # Names with explicit gender assignment
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
                jabatan=f"{random.choice(jabatan_list)}",
                jenis_kelamin=gender
            )
            db.add(p)
            personnels.append(p)
        db.commit()
        # Refresh to get IDs
        for p in personnels:
            db.refresh(p)
        print(f"{len(personnels)} Personnel seeded.")

    # 2. Seed Leave History
    # Get Admin ID for 'created_by'
    admin = db.query(models.User).filter(models.User.role == "super_admin").first()
    admin_id = admin.id if admin else 1

    if db.query(models.LeaveHistory).count() > 5:
         print("Leave history already populated.")
    else:
        print("Seeding Leave History...")
        
        # Types that can be used by anyone
        general_leave_types = ['cuti_tahunan', 'sakit', 'istimewa', 'alasan_penting', 'keagamaan']
        reasons = ["Acara Keluarga", "Sakit Demam", "Menikah", "Ibadah Umroh", "Urusan Mendesak", "Istirahat"]
        
        today = date.today()
        
        # Create some leaves in the past months for reports
        for _ in range(50):
            p = random.choice(personnels)
            days = random.randint(1, 5)
            # Random date within last 4 months
            start_date = today - timedelta(days=random.randint(0, 120))
            
            # Choose a valid leave type for this personnel
            if p.jenis_kelamin == 'P' and random.random() < 0.1:
                # 10% chance for female to have maternity leave
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
            
        # Create some ACTIVE leaves (happening today)
        for _ in range(5):
            p = random.choice(personnels)
            days = random.randint(3, 7)
            # Start date is today or recent enough to be active
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
                created_at=datetime.utcnow()
            )
            db.add(leave)
            
        db.commit()
        print("Leave History seeded.")

    # 3. Seed Audit Logs
    if db.query(models.AuditLog).count() > 0:
        print("Audit logs already exist.")
    else:
        print("Seeding Audit Logs...")
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
        print("Audit Logs seeded.")

    db.close()

if __name__ == "__main__":
    seed_data()
