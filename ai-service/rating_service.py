from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Kabadiwala Connect - Rating Service")

# 1. Request Schema
class RatingCreate(BaseModel):
    transaction_id: str
    reviewer_id: str
    reviewer_type: str = Field(..., pattern="^(customer|kabadiwala)$")
    reviewee_id: str
    rating: float = Field(..., ge=1.0, le=5.0)
    review_comment: Optional[str] = None

# In-memory storage
ratings_db: List[dict] = []

# 2. Submit Rating
@app.post("/ratings/submit")
def submit_rating(payload: RatingCreate):
    for r in ratings_db:
        if r["transaction_id"] == payload.transaction_id and r["reviewer_id"] == payload.reviewer_id:
            raise HTTPException(status_code=400, detail="Rating already submitted for this transaction.")
    
    entry = payload.model_dump()
    entry["timestamp"] = datetime.utcnow().isoformat()
    ratings_db.append(entry)
    
    return {
        "status": "success",
        "message": f"Rating recorded for {payload.reviewer_type} -> {payload.reviewee_id}",
        "rating": payload.rating
    }

# 3. Get User Profile Ratings
@app.get("/ratings/user/{user_id}")
def get_user_ratings(user_id: str):
    user_reviews = [r for r in ratings_db if r["reviewee_id"] == user_id]
    
    if not user_reviews:
        return {
            "user_id": user_id,
            "average_rating": 0.0,
            "total_reviews": 0,
            "reviews": []
        }
    
    total_score = sum(r["rating"] for r in user_reviews)
    avg_score = round(total_score / len(user_reviews), 2)
    
    return {
        "user_id": user_id,
        "average_rating": avg_score,
        "total_reviews": len(user_reviews),
        "reviews": user_reviews
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)