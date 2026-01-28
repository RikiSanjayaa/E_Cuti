import os
import sys
import subprocess

def run_db_refresh():
    # 1. Path to database file
    db_file = "polda_ntb.db"
    
    print("--- Database Reset & Seed Utility ---")
    
    # 2. Delete existing database
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"[*] Deleted existing database: {db_file}")
        except Exception as e:
            print(f"[!] Error deleting database: {e}")
            return
    else:
        print("[*] No existing database found. Fresh start.")

    # 3. Use venv python if available, otherwise fallback to system python
    python_bin = "venv/bin/python" if os.path.exists("venv/bin/python") else sys.executable
    print(f"[*] Using python: {python_bin}")

    # 4. Run initialization
    print("\n[*] Initializing database structure...")
    try:
        subprocess.run([python_bin, "-m", "backend.scripts.init_db"], check=True)
    except subprocess.CalledProcessError:
        print("[!] Initialization failed!")
        return

    # 5. Run seeding
    print("\n[*] Seeding database with dummy data...")
    try:
        subprocess.run([python_bin, "-m", "backend.scripts.seed_data"], check=True)
    except subprocess.CalledProcessError:
        print("[!] Seeding failed!")
        return

    print("\n[SUCCESS] Database has been reset and seeded successfully.")
    print("You can now login with: admin / admin123")

if __name__ == "__main__":
    run_db_refresh()
