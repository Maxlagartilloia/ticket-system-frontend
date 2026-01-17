from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
# Cambiamos la importación para usar el nuevo utils.py
from app.utils import hash_password 

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# =========================
# CREATE USER
# =========================
@router.post(
    "/",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # 1. Validar roles permitidos
    allowed_roles = ["admin", "supervisor", "technician", "client"]
    if payload.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed: {allowed_roles}"
        )

    # 2. Verificar email único
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 3. Crear usuario con HASH de contraseña (Seguridad Crítica)
    # Usamos hash_password de utils.py
    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        institution_id=payload.institution_id,
        is_active=True
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# =========================
# LIST USERS
# =========================
@router.get(
    "/",
    response_model=List[schemas.UserOut]
)
def list_users(
    db: Session = Depends(get_db)
):
    return (
        db.query(models.User)
        .order_by(models.User.id.asc())
        .all()
    )

# =========================
# GET USER BY ID
# =========================
@router.get(
    "/{user_id}",
    response_model=schemas.UserOut
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user
