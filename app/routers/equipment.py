from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(
    prefix="/equipment",
    tags=["Equipment"]
)

# =========================
# CREATE EQUIPMENT
# =========================
@router.post(
    "/",
    response_model=schemas.EquipmentOut,
    status_code=status.HTTP_201_CREATED
)
def create_equipment(
    payload: schemas.EquipmentCreate,
    db: Session = Depends(get_db)
):
    # 1. Verificar que el departamento exista
    department = (
        db.query(models.Department)
        .filter(models.Department.id == payload.department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # 2. Verificar que la institución del departamento exista (ADN Safety)
    institution = (
        db.query(models.Institution)
        .filter(models.Institution.id == department.institution_id)
        .first()
    )

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Institution not found for this department"
        )

    # 3. Crear instancia de Equipment
    new_equipment = models.Equipment(
        name=payload.name,
        model=payload.model,
        serial_number=payload.serial_number,
        department_id=payload.department_id
    )

    try:
        db.add(new_equipment)
        db.commit()
        db.refresh(new_equipment)
        return new_equipment
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# =========================
# LIST EQUIPMENT (BY DEPARTMENT)
# =========================
@router.get(
    "/department/{department_id}",
    response_model=List[schemas.EquipmentOut]
)
def list_equipment_by_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    # Verificar existencia del departamento
    department = (
        db.query(models.Department)
        .filter(models.Department.id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    return (
        db.query(models.Equipment)
        .filter(models.Equipment.department_id == department_id)
        .order_by(models.Equipment.name.asc())
        .all()
    )
