from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.db import Base

class ConversationTurn(Base):
    __tablename__ = "conversation_turns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(100), nullable=False)
    role = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    vertical = Column(String(50))
    sub_vertical = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(50), nullable=False)
    user_id = Column(String(100), nullable=False)
    conversation_id = Column(String(36))
    query_text = Column(Text)
    vertical = Column(String(50))
    sensitivity_level = Column(String(20))
    extra_metadata = Column("metadata", JSONB)   # 'metadata' is reserved by SQLAlchemy
    created_at = Column(DateTime(timezone=True), server_default=func.now())
