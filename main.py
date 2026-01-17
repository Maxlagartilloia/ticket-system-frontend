import sys
import os

# 🛠️ PARCHE DE RUTAS: 
# Este código permite que la función de Netlify encuentre la carpeta 'app' 
# que moviste a la raíz del repositorio.
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum  # El traductor para Netlify
from app.database import engine
from app.routers import auth, users, tickets, institutions, departments, equipment, reports

app = FastAPI(title="CopierMaster API")

# 🔒 Configuración de Seguridad
# Permitimos que tu dominio oficial y el acceso local hablen con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://soporte.copiermastercyg.com.ec", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🚀 Rutas del Sistema (Conectadas a Supabase)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(institutions.router)
app.include_router(departments.router)
app.include_router(equipment.router)
app.include_router(tickets.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {"status": "Sistema Online - Conectado a Supabase"}

# ⚡ MANEJADOR PARA NETLIFY
# Esta línea transforma FastAPI en una función que Netlify puede ejecutar
handler = Mangum(app)
