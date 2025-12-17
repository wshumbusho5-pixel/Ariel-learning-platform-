"""
Unit tests for SpacedRepetitionService.

Tests SM-2 algorithm implementation including review scheduling,
easiness factor calculations, and learning analytics.
"""

import pytest
from datetime import datetime, timedelta
from freezegun import freeze_time

from app.services.spaced_repetition import SpacedRepetitionService, ReviewQuality


# ===== INITIAL VALUES TESTS =====

@pytest.mark.unit
def test_get_initial_values():
    """Test getting initial values for a new card"""
    initial = SpacedRepetitionService.get_initial_values()

    assert initial["repetitions"] == 0
    assert initial["easiness_factor"] == 2.5
    assert initial["interval_days"] == 0
    assert "next_review_date" in initial
    assert isinstance(initial["next_review_date"], datetime)


# ===== CALCULATE NEXT REVIEW TESTS =====

@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_perfect_first_time():
    """Test perfect recall (5) on first review"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.PERFECT,
        repetitions=0,
        easiness_factor=2.5,
        interval_days=0
    )

    assert result["repetitions"] == 1
    assert result["interval_days"] == 1  # First correct review = 1 day
    assert result["easiness_factor"] > 2.5  # EF should increase
    assert result["next_review_date"] == datetime(2025, 1, 2, 12, 0, 0)


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_perfect_second_time():
    """Test perfect recall (5) on second review"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.PERFECT,
        repetitions=1,
        easiness_factor=2.6,
        interval_days=1
    )

    assert result["repetitions"] == 2
    assert result["interval_days"] == 6  # Second correct review = 6 days
    assert result["next_review_date"] == datetime(2025, 1, 7, 12, 0, 0)


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_perfect_third_time():
    """Test perfect recall (5) on third review"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.PERFECT,
        repetitions=2,
        easiness_factor=2.7,
        interval_days=6
    )

    assert result["repetitions"] == 3
    # Third review uses EF: interval = 6 * 2.7 = 16.2 rounds to 17
    assert result["interval_days"] == 17
    assert result["next_review_date"] == datetime(2025, 1, 18, 12, 0, 0)


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_hesitant_correct():
    """Test hesitant correct recall (4)"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.HESITANT_CORRECT,
        repetitions=0,
        easiness_factor=2.5,
        interval_days=0
    )

    assert result["repetitions"] == 1
    assert result["interval_days"] == 1
    # EF formula: 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02)) = 2.5
    # For quality=4, EF stays the same
    assert result["easiness_factor"] == 2.5


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_hard_correct():
    """Test hard correct recall (3)"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.HARD_CORRECT,
        repetitions=0,
        easiness_factor=2.5,
        interval_days=0
    )

    assert result["repetitions"] == 1
    assert result["interval_days"] == 1
    # EF should stay roughly the same or decrease slightly
    assert result["easiness_factor"] <= 2.5


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_incorrect_resets():
    """Test incorrect answer (<3) resets progress"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.EASY_INCORRECT,  # Quality = 2
        repetitions=5,  # Had good progress
        easiness_factor=2.8,
        interval_days=30
    )

    # Should reset repetitions and interval
    assert result["repetitions"] == 0
    assert result["interval_days"] == 1
    # EF should decrease
    assert result["easiness_factor"] < 2.8
    assert result["next_review_date"] == datetime(2025, 1, 2, 12, 0, 0)


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_blackout():
    """Test complete blackout (0) has harshest penalty"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.BLACKOUT,
        repetitions=5,
        easiness_factor=2.8,
        interval_days=30
    )

    # Should reset and have lowest EF adjustment
    assert result["repetitions"] == 0
    assert result["interval_days"] == 1
    # EF should decrease significantly (quality=0 gives EF=2.0)
    assert result["easiness_factor"] <= 2.0
    assert result["easiness_factor"] >= 1.3  # Minimum bound


@pytest.mark.unit
def test_calculate_next_review_ef_minimum_bound():
    """Test easiness factor doesn't go below 1.3"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.BLACKOUT,
        repetitions=0,
        easiness_factor=1.3,  # Already at minimum
        interval_days=0
    )

    # EF should not go below 1.3
    assert result["easiness_factor"] >= 1.3


@pytest.mark.unit
@freeze_time("2025-01-01 12:00:00")
def test_calculate_next_review_long_interval():
    """Test long intervals with high repetitions"""
    result = SpacedRepetitionService.calculate_next_review(
        quality=ReviewQuality.PERFECT,
        repetitions=10,
        easiness_factor=2.5,
        interval_days=100
    )

    assert result["repetitions"] == 11
    # Interval should grow: 100 * EF
    assert result["interval_days"] > 100
    # Date should be far in the future
    assert result["next_review_date"] > datetime(2025, 4, 1)


# ===== DUE FOR REVIEW TESTS =====

@pytest.mark.unit
@freeze_time("2025-01-15 12:00:00")
def test_is_due_for_review_past_date():
    """Test card is due when review date is in the past"""
    review_date = datetime(2025, 1, 10, 12, 0, 0)

    assert SpacedRepetitionService.is_due_for_review(review_date) is True


@pytest.mark.unit
@freeze_time("2025-01-15 12:00:00")
def test_is_due_for_review_exact_time():
    """Test card is due at exact review time"""
    review_date = datetime(2025, 1, 15, 12, 0, 0)

    assert SpacedRepetitionService.is_due_for_review(review_date) is True


@pytest.mark.unit
@freeze_time("2025-01-15 12:00:00")
def test_is_due_for_review_future_date():
    """Test card is not due when review date is in the future"""
    review_date = datetime(2025, 1, 20, 12, 0, 0)

    assert SpacedRepetitionService.is_due_for_review(review_date) is False


# ===== STUDY LOAD DISTRIBUTION TESTS =====

@pytest.mark.unit
def test_get_study_load_distribution_basic():
    """Test study load distribution calculation"""
    distribution = SpacedRepetitionService.get_study_load_distribution(
        total_cards=30,
        days=30
    )

    assert len(distribution) == 30
    assert all("day" in day for day in distribution)
    assert all("new_cards" in day for day in distribution)
    assert all("reviews" in day for day in distribution)


@pytest.mark.unit
def test_get_study_load_distribution_daily_new_cards():
    """Test daily new cards calculation"""
    distribution = SpacedRepetitionService.get_study_load_distribution(
        total_cards=30,
        days=30
    )

    # Should distribute evenly: 30 cards / 30 days = 1 per day
    assert distribution[0]["new_cards"] == 1
    assert distribution[15]["new_cards"] == 1


@pytest.mark.unit
def test_get_study_load_distribution_reviews_increase():
    """Test that review count increases over time"""
    distribution = SpacedRepetitionService.get_study_load_distribution(
        total_cards=100,
        days=30
    )

    # Later days should have more reviews
    early_reviews = distribution[2]["reviews"]
    late_reviews = distribution[25]["reviews"]

    assert late_reviews > early_reviews


@pytest.mark.unit
def test_get_study_load_distribution_small_deck():
    """Test distribution with small number of cards"""
    distribution = SpacedRepetitionService.get_study_load_distribution(
        total_cards=5,
        days=10
    )

    assert len(distribution) == 10
    # With 5 cards over 10 days, should have at least 1 new card per day initially
    assert distribution[0]["new_cards"] >= 1


@pytest.mark.unit
def test_get_study_load_distribution_large_deck():
    """Test distribution with large number of cards"""
    distribution = SpacedRepetitionService.get_study_load_distribution(
        total_cards=1000,
        days=30
    )

    assert len(distribution) == 30
    # Should have many new cards per day
    assert distribution[0]["new_cards"] > 10


# ===== RETENTION RATE TESTS =====

@pytest.mark.unit
def test_calculate_retention_rate_perfect():
    """Test 100% retention rate"""
    rate = SpacedRepetitionService.calculate_retention_rate(
        correct=10,
        total=10
    )

    assert rate == 100.0


@pytest.mark.unit
def test_calculate_retention_rate_half():
    """Test 50% retention rate"""
    rate = SpacedRepetitionService.calculate_retention_rate(
        correct=5,
        total=10
    )

    assert rate == 50.0


@pytest.mark.unit
def test_calculate_retention_rate_zero_correct():
    """Test 0% retention rate"""
    rate = SpacedRepetitionService.calculate_retention_rate(
        correct=0,
        total=10
    )

    assert rate == 0.0


@pytest.mark.unit
def test_calculate_retention_rate_zero_total():
    """Test retention rate with no reviews"""
    rate = SpacedRepetitionService.calculate_retention_rate(
        correct=0,
        total=0
    )

    # Should handle division by zero gracefully
    assert rate == 0.0


@pytest.mark.unit
def test_calculate_retention_rate_decimal():
    """Test retention rate rounds to one decimal place"""
    rate = SpacedRepetitionService.calculate_retention_rate(
        correct=7,
        total=9
    )

    # 7/9 = 77.777... should round to 77.8
    assert rate == 77.8
    assert isinstance(rate, float)


@pytest.mark.unit
def test_calculate_retention_rate_high_numbers():
    """Test retention rate with large numbers"""
    rate = SpacedRepetitionService.calculate_retention_rate(
        correct=850,
        total=1000
    )

    assert rate == 85.0
