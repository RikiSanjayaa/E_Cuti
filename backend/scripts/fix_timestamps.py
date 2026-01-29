
from backend.core.database import SessionLocal
from backend.models import LeaveHistory
from datetime import datetime, timedelta

def fix_timestamps():
    db = SessionLocal()
    current_utc = datetime.utcnow()
    print(f"Current UTC: {current_utc}")
    
    leaves = db.query(LeaveHistory).all()
    count = 0
    for l in leaves:
        if l.created_at and l.created_at > current_utc:
            old_val = l.created_at
            # If it's in the future, it likely was saved as Local Time (+8)
            l.created_at = l.created_at - timedelta(hours=8)
            print(f"ID {l.id}: {old_val} -> {l.created_at}")
            count += 1
    
    db.commit()
    print(f"Fixed {count} records")
    db.close()

if __name__ == "__main__":
    fix_timestamps()
