"""
SQLAlchemy relational models for LearnMate AI.
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="student")  # 'student' | 'teacher'
    language = Column(String, default="hi")   # 'hi' | 'en'
    grade = Column(Integer, default=8)
    school_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False)
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    topic_masteries = relationship("TopicMastery", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    daily_study_minutes = Column(Integer, default=45)
    preferred_subjects = Column(JSON, default=list)
    learning_pace = Column(String, default="moderate")

    user = relationship("User", back_populates="profile")

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(String, primary_key=True, index=True)
    grade = Column(Integer, index=True)
    subject = Column(String, index=True)
    topic = Column(String, index=True)
    title_en = Column(String, nullable=False)
    title_hi = Column(String, nullable=False)
    summary_en = Column(Text)
    summary_hi = Column(Text)
    content_en = Column(Text)
    content_hi = Column(Text)
    difficulty = Column(String, default="medium")
    is_sample = Column(Boolean, default=True)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(String, primary_key=True, index=True)
    grade = Column(Integer, index=True)
    subject = Column(String, index=True)
    topic = Column(String, index=True)
    title_en = Column(String)
    title_hi = Column(String)
    questions = Column(JSON, default=list)  # contains correct_answer server-side
    created_at = Column(DateTime, default=datetime.utcnow)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(String, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    user_id = Column(String, ForeignKey("users.id"))
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    submitted_answers = Column(JSON, default=dict)
    operation_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quiz_attempts")

class TopicMastery(Base):
    __tablename__ = "topic_mastery"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    subject = Column(String, index=True)
    topic = Column(String, index=True)
    total_graded_answers = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    observed_accuracy = Column(Float, default=0.0)
    mastery_status = Column(String, default="insufficient_evidence")
    recommendations = Column(JSON, default=list)
    last_calculated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="topic_masteries")
