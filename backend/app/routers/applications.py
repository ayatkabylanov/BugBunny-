from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from ..database import SessionLocal
from .. import crud, models

router = APIRouter(prefix="/api/applications", tags=["applications"])

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ApplicationIn(BaseModel):
    university_id: str = Field(..., example="kznu")
    university_name: Optional[str] = Field(None, example="КазНУ")
    program_id: str = Field(..., example="kznu_b_ph")
    program_title: Optional[str] = Field(None, example="Физика (Бакалавриат)")
    full_name: str = Field(..., example="Иванов Иван Иванович")
    email: EmailStr
    phone: Optional[str] = Field(None, example="+7 701 123 4567")
    message: Optional[str] = Field(None, example="Хочу на специальность ...")

class ApplicationOut(BaseModel):
    id: int
    university_id: str
    university_name: Optional[str]
    program_id: str
    program_title: Optional[str]
    full_name: str
    email: EmailStr
    phone: Optional[str]
    message: Optional[str]
    created_at: Optional[str]

    class Config:
        orm_mode = True

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationIn, db: Session = Depends(get_db)):
    created = crud.create_application(db, payload.dict())
    return created

@router.get("", response_model=List[ApplicationOut])
def list_applications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_applications(db, skip=skip, limit=limit)

@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db)):
    app = crud.get_application(db, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app
