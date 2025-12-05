from sqlalchemy.orm import Session
from . import models
from typing import Dict, Any

def create_application(db: Session, data: Dict[str, Any]):
    app = models.Application(
        university_id = data.get("university_id"),
        university_name = data.get("university_name"),
        program_id = data.get("program_id"),
        program_title = data.get("program_title"),
        full_name = data.get("full_name"),
        email = data.get("email"),
        phone = data.get("phone"),
        message = data.get("message"),
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

def get_applications(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Application).order_by(models.Application.id.desc()).offset(skip).limit(limit).all()

def get_application(db: Session, app_id: int):
    return db.query(models.Application).filter(models.Application.id == app_id).first()
