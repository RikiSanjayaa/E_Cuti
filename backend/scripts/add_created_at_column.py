import sqlite3
import os
from datetime import datetime

DB_PATH = "polda_ntb.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute("PRAGMA table_info(personnel)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "created_at" in columns:
        print("'created_at' column already exists in 'personnel' table.")
    else:
        print("Adding 'created_at' column to 'personnel' table...")
        # Add column
        cursor.execute("ALTER TABLE personnel ADD COLUMN created_at DATETIME")
        
        # Backdate existing records so they don't appear as "New this month"
        # Using a fixed date in the past
        past_date = "2024-01-01 00:00:00"
        cursor.execute("UPDATE personnel SET created_at = ?", (past_date,))
        
        conn.commit()
        print("Column added and existing records backdated.")

    conn.close()

if __name__ == "__main__":
    migrate()
