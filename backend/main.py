"""
FastAPI application entrypoint for LearnMate AI standalone Python backend.
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

app = FastAPI(
    title="LearnMate AI API",
    description="Quality Education for Every Student, Everywhere. Accessible, personalized, multilingual educational support for rural students.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str

class MasteryCalculationRequest(BaseModel):
    total_graded_answers: int
    correct_answers: int

class MasteryCalculationResponse(BaseModel):
    observed_accuracy: float
    mastery_status: str
    recommendations: List[Dict[str, Any]]

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "service": "LearnMate AI (FastAPI Engine)",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/mastery/evaluate-rule", response_model=MasteryCalculationResponse)
def evaluate_mastery_rule(req: MasteryCalculationRequest):
    """
    Transparent rule-based mastery engine evaluation as defined in specification.
    """
    total = req.total_graded_answers
    correct = req.correct_answers

    if total <= 0:
        return {
            "observed_accuracy": 0.0,
            "mastery_status": "insufficient_evidence",
            "recommendations": [{"type": "review_lesson", "message": "Attempt at least 3 questions to establish baseline"}]
        }

    accuracy = round(correct / total, 2)

    if total < 3:
        status_val = "insufficient_evidence"
        recs = [{"type": "review_lesson", "message": "Minimum 3 graded answers required for evaluation"}]
    elif accuracy < 0.50:
        status_val = "needs_revision"
        recs = [
            {"type": "review_lesson", "message": f"Accuracy is {int(accuracy * 100)}%. Review foundational concepts."},
            {"type": "practice_simpler", "message": "Practice simpler foundation questions."}
        ]
    elif accuracy < 0.80:
        status_val = "developing"
        recs = [{"type": "take_revision_quiz", "message": "Good foundation. Take a revision quiz to solidify mastery."}]
    else:
        if total >= 5:
            status_val = "demonstrated_proficiency"
            recs = [{"type": "advance_topic", "message": "Mastery confirmed! Advance to next topic."}]
        else:
            status_val = "developing"
            recs = [{"type": "take_revision_quiz", "message": "Practice 2 more questions to establish demonstrated proficiency."}]

    return {
        "observed_accuracy": accuracy,
        "mastery_status": status_val,
        "recommendations": recs
    }
