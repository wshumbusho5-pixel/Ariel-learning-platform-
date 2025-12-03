from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class AIUsageLog(BaseModel):
    """Track individual AI API calls"""
    id: Optional[str] = None
    user_id: str
    provider: Literal["openai", "anthropic", "ollama"]
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    endpoint: str  # /api/questions/answer, /api/scraper/scrape-url, etc.
    success: bool
    error_message: Optional[str] = None
    response_time_ms: int
    created_at: datetime = datetime.utcnow()

class ScraperLog(BaseModel):
    """Track scraping operations"""
    id: Optional[str] = None
    user_id: str
    source_type: Literal["url", "pdf", "image", "bulk"]
    source_url: Optional[str] = None
    questions_extracted: int
    success: bool
    error_message: Optional[str] = None
    processing_time_ms: int
    created_at: datetime = datetime.utcnow()

class DashboardStats(BaseModel):
    """Overview dashboard statistics"""
    # Today's stats
    active_users_today: int
    questions_answered_today: int
    ai_cost_today: float
    new_signups_today: int

    # 7-day trends
    daily_active_users: list[dict]  # [{date: "2024-12-01", count: 42}, ...]
    questions_per_day: list[dict]
    cost_per_day: list[dict]

    # Total stats
    total_users: int
    total_questions: int
    total_ai_cost: float

class UserStats(BaseModel):
    """Individual user statistics"""
    user_id: str
    email: str
    username: Optional[str]
    role: str
    created_at: datetime
    last_active: Optional[datetime]

    # Usage stats
    total_questions: int
    total_reviews: int
    current_streak: int
    total_points: int
    level: int

    # AI usage
    ai_requests: int
    ai_cost: float

class UsageMetrics(BaseModel):
    """AI usage and cost metrics"""
    # OpenAI
    openai_requests: int
    openai_tokens: int
    openai_cost: float

    # Anthropic
    anthropic_requests: int
    anthropic_tokens: int
    anthropic_cost: float

    # Totals
    total_requests: int
    total_tokens: int
    total_cost: float

    # Scraper stats
    urls_scraped: int
    pdfs_processed: int
    images_processed: int
    scraper_success_rate: float

    # Performance
    avg_response_time_ms: float
    error_rate: float
