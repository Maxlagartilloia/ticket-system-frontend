from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.database import get_db
from app import models, schemas

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Conteo total de tickets
    total_tickets = db.query(models.Ticket).count()
    
    # 2. Tickets abiertos (Pendientes)
    open_tickets = db.query(models.Ticket).filter(models.Ticket.status == "open").count()
    
    # 3. Tickets cerrados (Histórico total)
    closed_tickets = db.query(models.Ticket).filter(models.Ticket.status == "closed").count()
    
    # 4. Conteo de instituciones (Clientes registrados)
    total_institutions = db.query(models.Institution).count()

    # Retornamos los datos exactos que espera tu Frontend en Netlify
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "closed_tickets": closed_tickets,
        "total_institutions": total_institutions
    }
