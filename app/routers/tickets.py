from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.utils import ALGORITHM, SECRET_KEY
from jose import jwt
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- FUNCIÓN INTERNA PARA OBTENER USUARIO ACTUAL (EVITA ERROR CIRCULAR) ---
def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# =========================
# CREATE TICKET
# =========================
@router.post("/", response_model=schemas.TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Validar institución
    institution = db.query(models.Institution).filter(models.Institution.id == payload.institution_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    # 2. Crear instancia
    new_ticket = models.Ticket(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="open",
        institution_id=payload.institution_id,
        creator_id=current_user.id
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

# =========================
# LIST TICKETS (CON FILTROS DE SEGURIDAD)
# =========================
@router.get("/", response_model=List[schemas.TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Ticket)

    # Administradores y Supervisores ven todo
    if current_user.role in ["admin", "supervisor"]:
        return query.order_by(models.Ticket.created_at.desc()).all()

    # Técnicos ven sus asignados (Nota: Agregaremos assigned_to al modelo pronto si falta)
    # Por ahora, filtramos por creador para evitar errores si no hay columna assigned_to
    return query.filter(models.Ticket.creator_id == current_user.id).order_by(models.Ticket.created_at.desc()).all()

# =========================
# UPDATE STATUS
# =========================
@router.put("/{ticket_id}/status", response_model=schemas.TicketOut)
def update_ticket_status(
    ticket_id: int,
    status_value: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    valid_statuses = ["open", "in_progress", "closed"]
    if status_value not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be {valid_statuses}")

    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Seguridad: Clientes no cierran tickets
    if current_user.role == "client":
        raise HTTPException(status_code=403, detail="Clients cannot modify status")

    ticket.status = status_value
    db.commit()
    db.refresh(ticket)
    return ticket
