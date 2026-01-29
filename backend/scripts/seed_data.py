from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend import models
import random
from datetime import date, timedelta, datetime

def seed_data():
    db = SessionLocal()
    
    # 1. Seed Personnel
    if db.query(models.Personnel).count() > 0:
        print("Data personnel already exists. Skipping personnel seed.")
        personnels = db.query(models.Personnel).all()
    else:
        print("Seeding Personnel...")
        ranks = ["Bripda", "Briptu", "Brigadir", "Bripka", "Aipda", "Aiptu", "Ipda", "Iptu", "AKP", "Kompol", "AKBP", "Kombes"]
        jabatan_list = ["Anggota", "Kanit", "Kasubnit", "Pamin", "Kaur", "Kabag", "Kasat"]
        jabatan_list = ["Anggota", "Kanit", "Kasubnit", "Pamin", "Kaur", "Kabag", "Kasat"]
        names = [
            "Adi Pratama", "Budi Santoso", "Citra Dewi", "Dedi Kurniawan", "Eko Prasetyo", 
            "Fajar Nugroho", "Gita Pertiwi", "Hadi Sucipto", "Indah Sari", "Joko Susilo",
            "Kiki Amalia", "Lina Wati", "Muhamad Rizky", "Nurul Hidayah", "Oki Saputra",
            "Putri Ayu", "Qori Ahlam", "Rini Suharti", "Slamet Riyadi", "Tri Wahyuni"
        ]
        
        personnels = []
        for i, name in enumerate(names):
            p = models.Personnel(
                nrp=f"8501{1000+i}",
                nama=name,
                pangkat=random.choice(ranks),
                jabatan=f"{random.choice(jabatan_list)}",
                jenis_kelamin=random.choice(["L", "P"])
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
        leave_types = ["Cuti Tahunan", "Sakit", "Istimewa", "Alasan Penting", "Keagamaan"]
        reasons = ["Acara Keluarga", "Sakit Demam", "Menikah", "Ibadah Umroh", "Urusan Mendesak", "Istirahat"]
        
        today = date.today()
        
        # Create some leaves in the past months for reports
        for _ in range(50):
            p = random.choice(personnels)
            days = random.randint(1, 5)
            # Random date within last 4 months
            start_date = today - timedelta(days=random.randint(0, 120))
            
            leave = models.LeaveHistory(
                personnel_id=p.id,
                jenis_izin=random.choice(leave_types),
                jumlah_hari=days,
                tanggal_mulai=start_date,
                alasan=random.choice(reasons),
                created_by=admin_id,
                created_at=datetime.combine(start_date, datetime.min.time()) # Set created_at same as start approx
            )
            db.add(leave)
            
        # Create some ACTIVE leaves (happening today)
        for _ in range(5):
            p = random.choice(personnels)
            days = random.randint(3, 7)
            # Start date is today or recent enough to be active
            start_date = today - timedelta(days=random.randint(0, days-1))
            
            leave = models.LeaveHistory(
                personnel_id=p.id,
                jenis_izin=random.choice(leave_types),
                jumlah_hari=days,
                tanggal_mulai=start_date,
                alasan="Sedang Cuti (Active)",
                created_by=admin_id,
                created_at=datetime.now()
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
