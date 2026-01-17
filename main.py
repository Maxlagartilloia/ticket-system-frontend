from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.routers import auth, users, tickets, institutions, departments, equipment, reports

app = FastAPI(title="CopierMaster API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitimos todo para asegurar la conexión inicial
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(institutions.router)
app.include_router(departments.router)
app.include_router(equipment.router)
app.include_router(tickets.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {"status": "Sistema Online", "database": "Conectado a Supabase"}

handler = Mangum(app)
