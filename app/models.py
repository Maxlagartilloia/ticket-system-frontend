from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    users = relationship("User", back_populates="institution")
    tickets = relationship("Ticket", back_populates="institution")
    departments = relationship("Department", back_populates="institution")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id"))
    institution = relationship("Institution", back_populates="departments")
    equipment = relationship("Equipment", back_populates="department")

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    model = Column(String)
    serial_number = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    department = relationship("Department", back_populates="equipment")
    tickets = relationship("Ticket", back_populates="equipment")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="technician")
    is_active = Column(Boolean, default=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    institution = relationship("Institution", back_populates="users")
    created_tickets = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.creator_id")
    assigned_tickets = relationship("Ticket", back_populates="assigned_technician", foreign_keys="Ticket.assigned_to")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    creator_id = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"))
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    creator = relationship("User", back_populates="created_tickets", foreign_keys=[creator_id])
    assigned_technician = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to])
    institution = relationship("Institution", back_populates="tickets")
    equipment = relationship("Equipment", back_populates="tickets")
