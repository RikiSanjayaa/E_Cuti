"""
Migration script to add 'color' column to leave_types table.
Compatible with SQLite database.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.core.database import SessionLocal, engine

# Default colors for existing leave types
DEFAULT_COLORS = {
    "Cuti Tahunan": "blue",
    "Sakit": "red",
    "Melahirkan": "orange",
    "Alasan Penting": "purple",
    "Istimewa": "indigo",
    "Keagamaan": "teal",
    "Di Luar Tanggungan Negara": "slate"
}

def migrate():
    db = SessionLocal()
    try:
        # Check if column exists using SQLite-compatible PRAGMA
        result = db.execute(text("PRAGMA table_info(leave_types)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'color' in columns:
            print("Column 'color' already exists in leave_types table")
        else:
            # Add the column
            db.execute(text("ALTER TABLE leave_types ADD COLUMN color VARCHAR DEFAULT 'blue'"))
            db.commit()
            print("Added 'color' column to leave_types table")
        
        # Update existing leave types with their default colors
        for name, color in DEFAULT_COLORS.items():
            db.execute(
                text("UPDATE leave_types SET color = :color WHERE name = :name AND (color IS NULL OR color = 'blue')"),
                {"color": color, "name": name}
            )
        
        db.commit()
        print("Updated existing leave types with default colors")
        
        # Show current leave types
        result = db.execute(text("SELECT id, name, color FROM leave_types ORDER BY id"))
        print("\nCurrent leave types:")
        for row in result:
            print(f"  - {row.name}: {row.color}")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
