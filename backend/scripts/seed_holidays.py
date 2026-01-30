import sys
import os
import requests
import datetime

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.core.database import SessionLocal, engine, Base
from backend.models import Holiday

def seed_holidays():
    Base.metadata.create_all(bind=engine) # Ensure tables exist
    db = SessionLocal()
    
    current_year = datetime.date.today().year
    years_to_fetch = [current_year, current_year + 1]
    
    print(f"Fetching holidays for years: {years_to_fetch}")
    
    for year in years_to_fetch:
        try:
            # Using api-harilibur.vercel.app as discussed
            url = f"https://api-harilibur.vercel.app/api?year={year}"
            print(f"Fetching {url}...")
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                for item in data:
                    if item.get("is_national_holiday"):
                        raw_date = item.get("holiday_date") # Format: YYYY-M-D or YYYY-MM-DD
                        description = item.get("holiday_name")
                        
                        try:
                            date_obj = datetime.datetime.strptime(raw_date, "%Y-%m-%d").date()
                            
                            # Check if exists
                            existing = db.query(Holiday).filter(Holiday.date == date_obj).first()
                            if not existing:
                                holiday = Holiday(
                                    date=date_obj,
                                    description=description,
                                    is_active=True
                                )
                                db.add(holiday)
                                print(f"Added: {date_obj} - {description}")
                            else:
                                print(f"Skipped (exists): {date_obj} - {description}")
                                
                        except ValueError as e:
                            print(f"Error parsing date {raw_date}: {e}")
            else:
                print(f"Failed to fetch data for {year}: {response.status_code}")
                
        except Exception as e:
            print(f"Error processing {year}: {e}")
            
    db.commit()
    db.close()
    print("Holiday seeding completed.")

if __name__ == "__main__":
    seed_holidays()
