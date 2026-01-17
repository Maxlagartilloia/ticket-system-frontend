from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- USUARIOS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    is_active: Optional[bool] = True
    institution_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- INSTITUCIONES ---
class InstitutionBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionOut(InstitutionBase):
    id: int
    class Config:
        from_attributes = True

# --- DEPARTAMENTOS ---
class DepartmentBase(BaseModel):
    name: str
    institution_id: int

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# --- EQUIPOS / EQUIPMENT ---
class EquipmentBase(BaseModel):
    name: str
    model: Optional[str] = None
    serial_number: Optional[str] = None
    department_id: int

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentOut(EquipmentBase):
    id: int
    class Config:
        from_attributes = True

# --- TICKETS ---
class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "open"
    institution_id: int
    equipment_id: Optional[int] = None

class TicketCreate(TicketBase):
    pass

class TicketOut(TicketBase):
    id: int
    created_at: datetime
    creator_id: int
    assigned_to: Optional[int] = None
    class Config:
        from_attributes = True

# --- REPORTES Y ESTADÍSTICAS ---
class DashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    closed_tickets: int
    total_institutions: int

class ReportBase(BaseModel):
    title: str
    content: str

class ReportOut(ReportBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
