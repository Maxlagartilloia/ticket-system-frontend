from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os

# 🛡️ Configuración de Seguridad
# Usamos Bcrypt para el hash de contraseñas (Estándar de la industria)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🔑 Configuración del Token JWT
SECRET_KEY = os.getenv("SECRET_KEY", "copiermaster_super_secret_key_2024")
ALGORITHM = "HS256"

# --- FUNCIONES DE CONTRASEÑA ---

def hash_password(password: str):
    """Convierte texto plano en un hash seguro"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Compara la clave ingresada con el hash de la base de datos"""
    return pwd_context.verify(plain_password, hashed_password)

# --- FUNCIONES DE TOKEN JWT ---

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Genera el token que permite al usuario navegar identificado"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
