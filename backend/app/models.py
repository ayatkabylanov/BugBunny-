from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String(128), index=True)
    university_name = Column(String(256))
    program_id = Column(String(256))
    program_title = Column(String(256))
    full_name = Column(String(256))
    email = Column(String(256))
    phone = Column(String(64), nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
