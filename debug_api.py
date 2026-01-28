import requests

BASE_URL = "http://127.0.0.1:8000"

def debug_api():
    print(f"Testing API at {BASE_URL}...")
    
    # 1. Login
    try:
        login_resp = requests.post(f"{BASE_URL}/api/token", data={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_resp.status_code != 200:
            print(f"Login Failed: {login_resp.status_code} - {login_resp.text}")
            return
            
        token = login_resp.json()["access_token"]
        print("Login Successful. Token obtained.")
        
        # 2. Get Users
        headers = {"Authorization": f"Bearer {token}"}
        users_resp = requests.get(f"{BASE_URL}/api/users/", headers=headers)
        
        print(f"Get Users Status: {users_resp.status_code}")
        print(f"Get Users Response: {users_resp.text}")
        
    except Exception as e:
        print(f"Connection Error: {e}")
        print("Make sure uvicorn is running on port 8000")

if __name__ == "__main__":
    debug_api()
