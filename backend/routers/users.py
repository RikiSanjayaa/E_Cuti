from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext
from backend.core import database, auth
from backend import models, schemas

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

@router.get("/", response_model=List[schemas.User])
async def get_users(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.User)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.User.username.ilike(search_filter)) |
            (models.User.email.ilike(search_filter)) |
            (models.User.full_name.ilike(search_filter))
        )
    
    if role and role != "all":
        query = query.filter(models.User.role == role)
        
    if status and status != "all":
        query = query.filter(models.User.is_active == (status == "active"))
        
    # Total Count
    total = query.count()
    response.headers["X-Total-Count"] = str(total)
    
    # Sorting
    if sort_by:
        valid_sort_fields = {
            "username": models.User.username,
            "full_name": models.User.full_name,
            "email": models.User.email,
            "role": models.User.role,
            "created_at": models.User.created_at
        }
        
        sort_column = valid_sort_fields.get(sort_by, models.User.created_at)
        
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(models.User.created_at.desc())

    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=schemas.User)
async def create_user(
    request: Request,
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
    auth.log_audit(
        db, 
        current_user.id, 
        "CREATE_USER", 
        "User Management", 
        user.username, 
        "User", 
        "Created new user",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    request: Request,
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
    log_action = "UPDATE_USER"
    log_details = "Updated user profile"
    log_status = "success"
    
    # Check for deactivation
    if user_update.status == "inactive" and db_user.status == "inactive":
         log_action = "DEACTIVATE_USER"
         log_details = f"Deactivated user {db_user.username}"
         log_status = "warning"
    # Check for activation
    elif user_update.status == "active" and db_user.status == "active":
         log_action = "ACTIVATE_USER"
         log_details = f"Activated user {db_user.username}"
         log_status = "success"
         
    auth.log_audit(
        db, 
        current_user.id, 
        log_action, 
        "User Management", 
        db_user.username, 
        "User", 
        log_details,
        status=log_status,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return db_user

@router.post("/{user_id}/reset-password")
async def reset_password(
    request: Request,
    user_id: int,
    reset_data: schemas.PasswordResetRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    
    # Log action
    auth.log_audit(
        db, 
        current_user.id, 
        "RESET_PASSWORD", 
        "User Management", 
        db_user.username, 
        "User", 
        "Reset user password",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "Password reset successfully", "temporary_password": reset_data.new_password}

import pandas as pd
import io
from fastapi import UploadFile, File

@router.post("/import", response_model=dict)
async def import_users(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns validation
        required_columns = ['username', 'password', 'full_name', 'role', 'email']
        # Normalize column names to lowercase for checking
        df.columns = [c.lower().strip() for c in df.columns]
        
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
             raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_cols)}")
             
        success_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                username = str(row['username']).strip()
                if pd.isna(username) or not username:
                    continue
                    
                # Check duplicate
                if db.query(models.User).filter(models.User.username == username).first():
                    errors.append(f"Row {index+2}: Username '{username}' already exists")
                    continue
                
                # Create user
                new_user = models.User(
                    username=username,
                    password_hash=get_password_hash(str(row['password'])),
                    full_name=str(row['full_name']) if not pd.isna(row['full_name']) else None,
                    role=str(row['role']).lower() if not pd.isna(row['role']) else 'admin',
                    email=str(row['email']) if not pd.isna(row['email']) else None,
                    status='active'
                )
                db.add(new_user)
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {index+2}: {str(e)}")
                
        db.commit()
        
        # Log action
        auth.log_audit(db, current_user.id, "IMPORT_USERS", "User Management", "Batch Import", "User", f"Imported {success_count} users")

        return {
            "message": f"Successfully imported {success_count} users",
            "errors": errors,
            "total_processed": len(df)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
