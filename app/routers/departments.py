from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)

# =========================
# CREATE DEPARTMENT
# =========================
@router.post("/", response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: schemas.DepartmentCreate, 
    db: Session = Depends(get_db)
):
    # 1. Validar que la institución exista antes de asignar el departamento
    inst = db.query(models.Institution).filter(models.Institution.id == payload.institution_id).first()
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Institution not found. Cannot create department."
        )
    
    # 2. Crear el registro
    new_dept = models.Department(
        name=payload.name,
        institution_id=payload.institution_id
    )
    
    try:
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
        return new_dept
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# =========================
# LIST DEPARTMENTS BY INSTITUTION
# =========================
@router.get("/institution/{institution_id}", response_model=List[schemas.DepartmentOut])
def list_departments_by_institution(
    institution_id: int, 
    db: Session = Depends(get_db)
):
    # Buscamos todos los departamentos vinculados a la ID de la institución
    departments = db.query(models.Department).filter(
        models.Department.institution_id == institution_id
    ).all()
    
    return departments

# =========================
# DELETE DEPARTMENT
# =========================
@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    dept = db.query(models.Department).filter(models.Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(dept)
    db.commit()
    return None
