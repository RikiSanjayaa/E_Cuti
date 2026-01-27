from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

@router.get("/", response_model=List[schemas.User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.username.ilike(search_term)) |
            (models.User.full_name.ilike(search_term)) |
            (models.User.email.ilike(search_term))
        )
        
    if role and role != 'all':
        query = query.filter(models.User.role == role)
        
    if status and status != 'all':
        query = query.filter(models.User.status == status)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        status=user.status,
        password_hash=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log action
    auth.log_audit(db, current_user.id, "CREATE_USER", "User Management", user.username, "User", "Created new user")
    
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
    if user_update.role is not None:
        db_user.role = user_update.role
    if user_update.email is not None:
        db_user.email = user_update.email
    if user_update.status is not None:
        db_user.status = user_update.status
    if user_update.password:
        db_user.password_hash = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    
    # Log action
    auth.log_audit(db, current_user.id, "UPDATE_USER", "User Management", db_user.username, "User", "Updated user profile")
    
    return db_user

@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Reset to default password (e.g., 'password123') - in prod should be random email
    default_password = "password123"
    db_user.password_hash = get_password_hash(default_password)
    db.commit()
    
    # Log action
    auth.log_audit(db, current_user.id, "RESET_PASSWORD", "User Management", db_user.username, "User", "Reset user password")
    
    return {"message": "Password reset successfully", "temporary_password": default_password}
