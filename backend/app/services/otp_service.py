import random
from datetime import datetime, timedelta

# In-memory storage for demo purposes (clears when server restarts)
# Format: { "email@college.edu": {"code": "123456", "expires_at": datetime} }
OTP_STORE = {}

def generate_otp(email: str) -> str:
    """Generates a 6-digit OTP, stores it, and prints it to console."""
    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5) # Valid for 5 minutes
    
    OTP_STORE[email] = {
        "code": code,
        "expires_at": expires_at
    }
    
    # SIMULATE SENDING EMAIL
    print("\n" + "="*50)
    print(f"📧 MOCK EMAIL SENT TO: {email}")
    print(f"🔑 YOUR OTP CODE IS:   {code}")
    print("="*50 + "\n")
    
    return code

def verify_otp(email: str, code: str) -> bool:
    """Checks if the OTP matches and hasn't expired."""
    record = OTP_STORE.get(email)
    if not record:
        return False
    
    if datetime.utcnow() > record["expires_at"]:
        del OTP_STORE[email] # Clean up expired code
        return False
        
    if record["code"] != code:
        return False
        
    # Success! Remove the code so it can't be reused
    del OTP_STORE[email]
    return True