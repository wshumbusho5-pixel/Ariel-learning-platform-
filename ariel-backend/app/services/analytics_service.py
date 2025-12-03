from datetime import datetime, timedelta
from typing import Optional, List
from app.services.database_service import db_service
from app.models.analytics import (
    AIUsageLog, ScraperLog, DashboardStats, UserStats, UsageMetrics
)
from bson import ObjectId

class AnalyticsService:
    """Service for tracking and retrieving analytics data"""

    @staticmethod
    async def log_ai_usage(
        user_id: str,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        cost_usd: float,
        endpoint: str,
        success: bool,
        error_message: Optional[str] = None,
        response_time_ms: int = 0
    ):
        """Log an AI API call"""
        db = db_service.get_db()

        log = {
            "user_id": user_id,
            "provider": provider,
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "cost_usd": cost_usd,
            "endpoint": endpoint,
            "success": success,
            "error_message": error_message,
            "response_time_ms": response_time_ms,
            "created_at": datetime.utcnow()
        }

        await db["ai_usage_logs"].insert_one(log)

    @staticmethod
    async def log_scraper_usage(
        user_id: str,
        source_type: str,
        questions_extracted: int,
        success: bool,
        source_url: Optional[str] = None,
        error_message: Optional[str] = None,
        processing_time_ms: int = 0
    ):
        """Log a scraping operation"""
        db = db_service.get_db()

        log = {
            "user_id": user_id,
            "source_type": source_type,
            "source_url": source_url,
            "questions_extracted": questions_extracted,
            "success": success,
            "error_message": error_message,
            "processing_time_ms": processing_time_ms,
            "created_at": datetime.utcnow()
        }

        await db["scraper_logs"].insert_one(log)

    @staticmethod
    async def get_dashboard_stats() -> DashboardStats:
        """Get stats for admin dashboard"""
        db = db_service.get_db()
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        week_ago = now - timedelta(days=7)

        # Today's stats
        active_users_today = await db["users"].count_documents({
            "last_login": {"$gte": today_start}
        })

        # Count AI requests today (as proxy for questions answered)
        questions_today = await db["ai_usage_logs"].count_documents({
            "created_at": {"$gte": today_start}
        })

        # AI cost today
        cost_pipeline = [
            {"$match": {"created_at": {"$gte": today_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$cost_usd"}}}
        ]
        cost_result = await db["ai_usage_logs"].aggregate(cost_pipeline).to_list(1)
        ai_cost_today = cost_result[0]["total"] if cost_result else 0.0

        # New signups today
        new_signups = await db["users"].count_documents({
            "created_at": {"$gte": today_start}
        })

        # 7-day trends - Daily Active Users
        dau_pipeline = [
            {"$match": {"last_login": {"$gte": week_ago}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$last_login"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        dau_data = await db["users"].aggregate(dau_pipeline).to_list(None)
        daily_active_users = [{"date": item["_id"], "count": item["count"]} for item in dau_data]

        # Questions per day
        questions_pipeline = [
            {"$match": {"created_at": {"$gte": week_ago}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        questions_data = await db["ai_usage_logs"].aggregate(questions_pipeline).to_list(None)
        questions_per_day = [{"date": item["_id"], "count": item["count"]} for item in questions_data]

        # Cost per day
        cost_per_day_pipeline = [
            {"$match": {"created_at": {"$gte": week_ago}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "cost": {"$sum": "$cost_usd"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        cost_data = await db["ai_usage_logs"].aggregate(cost_per_day_pipeline).to_list(None)
        cost_per_day = [{"date": item["_id"], "cost": round(item["cost"], 2)} for item in cost_data]

        # Total stats
        total_users = await db["users"].count_documents({})
        total_questions = await db["ai_usage_logs"].count_documents({})

        total_cost_pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$cost_usd"}}}
        ]
        total_cost_result = await db["ai_usage_logs"].aggregate(total_cost_pipeline).to_list(1)
        total_ai_cost = total_cost_result[0]["total"] if total_cost_result else 0.0

        return DashboardStats(
            active_users_today=active_users_today,
            questions_answered_today=questions_today,
            ai_cost_today=round(ai_cost_today, 2),
            new_signups_today=new_signups,
            daily_active_users=daily_active_users,
            questions_per_day=questions_per_day,
            cost_per_day=cost_per_day,
            total_users=total_users,
            total_questions=total_questions,
            total_ai_cost=round(total_ai_cost, 2)
        )

    @staticmethod
    async def get_all_users(skip: int = 0, limit: int = 50) -> List[UserStats]:
        """Get all users with their stats"""
        db = db_service.get_db()

        users = await db["users"].find().skip(skip).limit(limit).to_list(None)

        user_stats = []
        for user in users:
            # Get user's AI usage
            ai_count = await db["ai_usage_logs"].count_documents({"user_id": str(user["_id"])})
            cost_pipeline = [
                {"$match": {"user_id": str(user["_id"])}},
                {"$group": {"_id": None, "total": {"$sum": "$cost_usd"}}}
            ]
            cost_result = await db["ai_usage_logs"].aggregate(cost_pipeline).to_list(1)
            ai_cost = cost_result[0]["total"] if cost_result else 0.0

            # Get reviews count (from progress)
            reviews_count = await db["reviews"].count_documents({"user_id": str(user["_id"])})

            user_stats.append(UserStats(
                user_id=str(user["_id"]),
                email=user["email"],
                username=user.get("username"),
                role=user.get("role", "user"),
                created_at=user["created_at"],
                last_active=user.get("last_login"),
                total_questions=ai_count,
                total_reviews=reviews_count,
                current_streak=user.get("current_streak", 0),
                total_points=user.get("total_points", 0),
                level=user.get("level", 1),
                ai_requests=ai_count,
                ai_cost=round(ai_cost, 2)
            ))

        return user_stats

    @staticmethod
    async def get_usage_metrics(days: int = 7) -> UsageMetrics:
        """Get AI usage and cost metrics"""
        db = db_service.get_db()
        start_date = datetime.utcnow() - timedelta(days=days)

        # OpenAI stats
        openai_pipeline = [
            {"$match": {"provider": "openai", "created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": None,
                    "requests": {"$sum": 1},
                    "tokens": {"$sum": "$total_tokens"},
                    "cost": {"$sum": "$cost_usd"}
                }
            }
        ]
        openai_result = await db["ai_usage_logs"].aggregate(openai_pipeline).to_list(1)
        openai_stats = openai_result[0] if openai_result else {"requests": 0, "tokens": 0, "cost": 0.0}

        # Anthropic stats
        anthropic_pipeline = [
            {"$match": {"provider": "anthropic", "created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": None,
                    "requests": {"$sum": 1},
                    "tokens": {"$sum": "$total_tokens"},
                    "cost": {"$sum": "$cost_usd"}
                }
            }
        ]
        anthropic_result = await db["ai_usage_logs"].aggregate(anthropic_pipeline).to_list(1)
        anthropic_stats = anthropic_result[0] if anthropic_result else {"requests": 0, "tokens": 0, "cost": 0.0}

        # Scraper stats
        urls_scraped = await db["scraper_logs"].count_documents({
            "source_type": "url",
            "created_at": {"$gte": start_date}
        })
        pdfs_processed = await db["scraper_logs"].count_documents({
            "source_type": "pdf",
            "created_at": {"$gte": start_date}
        })
        images_processed = await db["scraper_logs"].count_documents({
            "source_type": "image",
            "created_at": {"$gte": start_date}
        })

        total_scraper = await db["scraper_logs"].count_documents({"created_at": {"$gte": start_date}})
        successful_scraper = await db["scraper_logs"].count_documents({
            "success": True,
            "created_at": {"$gte": start_date}
        })
        scraper_success_rate = (successful_scraper / total_scraper * 100) if total_scraper > 0 else 0.0

        # Performance metrics
        avg_response_pipeline = [
            {"$match": {"created_at": {"$gte": start_date}, "success": True}},
            {"$group": {"_id": None, "avg": {"$avg": "$response_time_ms"}}}
        ]
        avg_response_result = await db["ai_usage_logs"].aggregate(avg_response_pipeline).to_list(1)
        avg_response_time = avg_response_result[0]["avg"] if avg_response_result else 0.0

        total_requests = await db["ai_usage_logs"].count_documents({"created_at": {"$gte": start_date}})
        failed_requests = await db["ai_usage_logs"].count_documents({
            "success": False,
            "created_at": {"$gte": start_date}
        })
        error_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0.0

        return UsageMetrics(
            openai_requests=openai_stats["requests"],
            openai_tokens=openai_stats["tokens"],
            openai_cost=round(openai_stats["cost"], 2),
            anthropic_requests=anthropic_stats["requests"],
            anthropic_tokens=anthropic_stats["tokens"],
            anthropic_cost=round(anthropic_stats["cost"], 2),
            total_requests=openai_stats["requests"] + anthropic_stats["requests"],
            total_tokens=openai_stats["tokens"] + anthropic_stats["tokens"],
            total_cost=round(openai_stats["cost"] + anthropic_stats["cost"], 2),
            urls_scraped=urls_scraped,
            pdfs_processed=pdfs_processed,
            images_processed=images_processed,
            scraper_success_rate=round(scraper_success_rate, 1),
            avg_response_time_ms=round(avg_response_time, 0),
            error_rate=round(error_rate, 1)
        )
