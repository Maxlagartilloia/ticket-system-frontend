from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.utils import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 🔍 Buscamos al usuario en Supabase usando el email del formulario
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # 🔐 Verificamos existencia y contraseña (usando el hash que insertamos por SQL)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Email o contraseña incorrectos"
        )
    
    # 🎫 Generamos el token de acceso con el rol correspondiente
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    # 🚀 Retornamos los datos que el frontend (js/login.js) espera guardar en localStorage
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role if user.role else "admin",
        "full_name": user.full_name if user.full_name else "Administrador"
    }
