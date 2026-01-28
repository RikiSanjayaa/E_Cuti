from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from .. import database, models, auth, schemas

router = APIRouter(
    prefix="/api",
    tags=["Authentication"]
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last_active
    try:
        user.last_active = datetime.now()
        db.commit()
        db.refresh(user)
    except Exception as e:
        print(f"Error updating last_active: {e}")
        # Build token anyway even if last_active fails
        pass

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Log Audit
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent")
    auth.log_audit(
        db, 
        user.id, 
        "LOGIN", 
        "Authentication", 
        user.username, 
        "User", 
        "Successful login to system",
        ip_address=client_ip,
        user_agent=user_agent
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "username": user.username
    }
