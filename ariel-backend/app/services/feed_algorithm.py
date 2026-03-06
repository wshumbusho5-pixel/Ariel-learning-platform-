"""
Personalized Feed Algorithm

Generates a personalized feed of deck posts for each user based on:
1. People they follow (60%)
2. Their subjects (30%)
3. Trending content (10%)
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta


class FeedAlgorithm:
    """
    Personalized feed generation algorithm
    """

    def __init__(self, db):
        self.db = db

    async def generate_feed(
        self,
        user_id: str,
        user_subjects: List[str],
        user_following: List[str],
        user_education_level: Optional[str] = None,
        user_school: Optional[str] = None,
        user_courses: List[str] = [],
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """
        Generate personalized feed for user

        Algorithm:
        1. 60% - Decks from people user follows (any subject)
        2. 30% - Decks from user's subjects (any user)
        3. 10% - Trending decks (popular, recent)

        Returns: List of deck posts with engagement data
        """
        feed_items = []

        # Calculate distribution
        following_count = int(limit * 0.6)  # 60%
        subjects_count = int(limit * 0.3)   # 30%
        trending_count = limit - following_count - subjects_count  # 10%

        # 1. Decks from people user follows (60%)
        if user_following:
            following_decks = await self._get_following_decks(
                user_following,
                limit=following_count,
                exclude_private=True
            )
            feed_items.extend(following_decks)

        # 2. Decks from user's subjects (30%)
        if user_subjects:
            subject_decks = await self._get_subject_decks(
                user_subjects,
                user_education_level,
                exclude_user_ids=[user_id] + user_following,  # Don't duplicate following
                limit=subjects_count
            )
            feed_items.extend(subject_decks)

        # 3. Trending decks (10%)
        trending_decks = await self._get_trending_decks(
            exclude_user_ids=[user_id] + user_following,
            limit=trending_count
        )
        feed_items.extend(trending_decks)

        # Sort by engagement score and recency
        feed_items = self._rank_feed_items(feed_items)

        # Apply offset and limit
        return feed_items[offset:offset + limit]

    async def _get_following_decks(
        self,
        following_ids: List[str],
        limit: int,
        exclude_private: bool = True
    ) -> List[Dict]:
        """
        Get decks from people user follows

        - Excludes private decks
        - Orders by recency
        """
        query = {
            "user_id": {"$in": following_ids}
        }

        if exclude_private:
            query["visibility"] = {"$ne": "private"}

        decks = []
        async for deck in self.db.decks.find(query).sort("published_at", -1).limit(limit):
            # Add engagement score
            deck["engagement_score"] = self._calculate_engagement_score(deck)
            deck["source"] = "following"
            decks.append(deck)

        return decks

    async def _get_subject_decks(
        self,
        subjects: List[str],
        education_level: Optional[str],
        exclude_user_ids: List[str],
        limit: int
    ) -> List[Dict]:
        """
        Get decks from user's subjects

        - Matches subject and optionally education level
        - Excludes already shown users
        - Prioritizes highly engaged content
        """
        query = {
            "subject": {"$in": subjects},
            "user_id": {"$nin": exclude_user_ids},
            "visibility": {"$in": ["public", "subject_community"]}
        }

        # Optionally filter by education level
        if education_level:
            query["$or"] = [
                {"education_level": education_level},
                {"education_level": None}  # Include decks without level specified
            ]

        decks = []
        async for deck in self.db.decks.find(query).sort("likes", -1).limit(limit * 2):
            # Add engagement score
            deck["engagement_score"] = self._calculate_engagement_score(deck)
            deck["source"] = "subjects"
            decks.append(deck)

        # Sort by engagement and take top limit
        decks.sort(key=lambda x: x["engagement_score"], reverse=True)
        return decks[:limit]

    async def _get_trending_decks(
        self,
        exclude_user_ids: List[str],
        limit: int,
        time_window_days: int = 7
    ) -> List[Dict]:
        """
        Get trending decks from past week

        - High engagement in recent time window
        - Excludes already shown users
        - Public visibility only
        """
        cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)

        query = {
            "user_id": {"$nin": exclude_user_ids},
            "visibility": "public",
            "published_at": {"$gte": cutoff_date}
        }

        decks = []
        async for deck in self.db.decks.find(query).limit(limit * 3):
            # Calculate trending score (recency + engagement)
            deck["engagement_score"] = self._calculate_engagement_score(deck)
            deck["trending_score"] = self._calculate_trending_score(deck)
            deck["source"] = "trending"
            decks.append(deck)

        # Sort by trending score
        decks.sort(key=lambda x: x["trending_score"], reverse=True)
        return decks[:limit]

    def _calculate_engagement_score(self, deck: Dict) -> float:
        """
        Calculate engagement score for ranking

        Formula: (likes * 2 + saves * 3 + views * 0.1) / age_penalty

        - Likes: 2 points each
        - Saves: 3 points each (stronger signal)
        - Views: 0.1 points each
        - Age penalty: Older content ranked lower
        """
        likes = deck.get("likes", 0)
        saves = deck.get("saves", 0)
        views = deck.get("views", 0)

        # Base engagement
        engagement = (likes * 2) + (saves * 3) + (views * 0.1)

        # Age penalty (decay over time)
        published_at = deck.get("published_at")
        if published_at:
            age_days = (datetime.utcnow() - published_at).days
            age_penalty = 1 / (1 + (age_days * 0.1))  # Decay by 10% per day
        else:
            age_penalty = 0.5  # Unpublished content gets lower score

        return engagement * age_penalty

    def _calculate_trending_score(self, deck: Dict) -> float:
        """
        Calculate trending score (emphasizes recency more)

        Formula: engagement_score * recency_multiplier

        - Recent content gets 10x boost
        - Declines over 7 days
        """
        engagement = self._calculate_engagement_score(deck)

        published_at = deck.get("published_at")
        if not published_at:
            return engagement * 0.1  # Unpublished = very low trending score

        age_hours = (datetime.utcnow() - published_at).total_seconds() / 3600

        # Recency multiplier (10x for new content, declines to 1x over 7 days)
        if age_hours < 24:
            recency_multiplier = 10.0  # Super boost for first 24 hours
        elif age_hours < 72:
            recency_multiplier = 5.0   # Strong boost for first 3 days
        elif age_hours < 168:
            recency_multiplier = 2.0   # Moderate boost for first week
        else:
            recency_multiplier = 1.0   # Normal after 1 week

        return engagement * recency_multiplier

    def _rank_feed_items(self, items: List[Dict]) -> List[Dict]:
        """
        Final ranking of feed items

        - Mixes sources (no clumping)
        - Prioritizes high engagement
        - Adds diversity
        """
        # Group by source
        following = [item for item in items if item.get("source") == "following"]
        subjects = [item for item in items if item.get("source") == "subjects"]
        trending = [item for item in items if item.get("source") == "trending"]

        # Sort each group by engagement
        following.sort(key=lambda x: x.get("engagement_score", 0), reverse=True)
        subjects.sort(key=lambda x: x.get("engagement_score", 0), reverse=True)
        trending.sort(key=lambda x: x.get("trending_score", 0), reverse=True)

        # Interleave sources for diversity
        ranked = []
        max_len = max(len(following), len(subjects), len(trending))

        for i in range(max_len):
            # Add from each source in rotation
            if i < len(following):
                ranked.append(following[i])
            if i < len(subjects):
                ranked.append(subjects[i])
            if i < len(trending):
                ranked.append(trending[i])

        return ranked


async def enrich_deck_with_author(db, deck: Dict, current_user_id: str) -> Dict:
    """
    Enrich deck data with author information

    - Author username, name, picture, badges
    - Check if current user liked/saved
    """
    # Get author info
    author = await db.users.find_one({"_id": deck["user_id"]})

    # Build enriched deck post
    enriched = {
        "id": str(deck["_id"]),
        "user_id": deck["user_id"],
        "title": deck["title"],
        "description": deck.get("description"),
        "cover_image": deck.get("cover_image"),
        "subject": deck["subject"],
        "topic": deck.get("topic"),
        "education_level": deck.get("education_level"),
        "course_code": deck.get("course_code"),
        "tags": deck.get("tags", []),
        "card_count": deck.get("card_count", 0),
        "visibility": deck["visibility"],
        "is_featured": deck.get("is_featured", False),

        # Engagement
        "likes": deck.get("likes", 0),
        "saves": deck.get("saves", 0),
        "views": deck.get("views", 0),
        "comments_count": deck.get("comments_count", 0),

        # Author info
        "author_username": author.get("username") if author else None,
        "author_full_name": author.get("full_name") if author else None,
        "author_profile_picture": author.get("profile_picture") if author else None,
        "author_is_teacher": author.get("is_teacher", False) if author else False,
        "author_is_verified": author.get("is_verified", False) if author else False,

        # Social context
        "is_liked": current_user_id in deck.get("liked_by", []) if current_user_id else False,
        "is_saved": current_user_id in deck.get("saved_by", []) if current_user_id else False,

        # Metadata
        "created_at": deck["created_at"],
        "published_at": deck.get("published_at"),

        # Feed metadata
        "source": deck.get("source", "unknown")
    }

    return enriched
