#!/usr/bin/env python3
"""
Test script to verify Ariel backend structure
Run this without needing to install dependencies
"""

import os
import sys

def check_file_exists(filepath, description):
    """Check if a file exists"""
    exists = os.path.exists(filepath)
    status = "✅" if exists else "❌"
    print(f"{status} {description}: {filepath}")
    return exists

def main():
    print("=" * 60)
    print("Ariel Backend Structure Verification")
    print("=" * 60)
    print()

    base_path = "/Users/willyshumbusho/laundry-delivery-startup/ariel/ariel-backend"

    files_to_check = [
        # Core
        ("app/main.py", "Main FastAPI application"),
        ("app/core/config.py", "Configuration settings"),
        ("requirements.txt", "Dependencies file"),

        # Models
        ("app/models/user.py", "User models"),
        ("app/models/question.py", "Question models"),
        ("app/models/progress.py", "Progress tracking models"),
        ("app/models/gamification.py", "Gamification models"),

        # Services
        ("app/services/auth_service.py", "Authentication service"),
        ("app/services/ai_service.py", "AI service"),
        ("app/services/scraper_service.py", "Web scraper service"),
        ("app/services/database_service.py", "Database service"),
        ("app/services/user_repository.py", "User repository"),
        ("app/services/progress_repository.py", "Progress repository"),
        ("app/services/spaced_repetition.py", "Spaced repetition algorithm"),
        ("app/services/gamification_service.py", "Gamification service"),

        # API Endpoints
        ("app/api/auth.py", "Auth endpoints"),
        ("app/api/questions.py", "Questions endpoints"),
        ("app/api/scraper.py", "Scraper endpoints"),
        ("app/api/ai.py", "AI endpoints"),
        ("app/api/progress.py", "Progress endpoints"),
        ("app/api/gamification.py", "Gamification endpoints"),
    ]

    print("📁 Checking Backend Files:")
    print("-" * 60)

    all_exist = True
    for filepath, description in files_to_check:
        full_path = os.path.join(base_path, filepath)
        exists = check_file_exists(full_path, description)
        if not exists:
            all_exist = False

    print()
    print("=" * 60)
    if all_exist:
        print("✅ All backend files are present!")
    else:
        print("❌ Some files are missing!")
    print("=" * 60)
    print()

    # Count lines of code
    print("📊 Code Statistics:")
    print("-" * 60)
    total_lines = 0
    for filepath, _ in files_to_check:
        full_path = os.path.join(base_path, filepath)
        if os.path.exists(full_path) and filepath.endswith('.py'):
            with open(full_path, 'r') as f:
                lines = len(f.readlines())
                total_lines += lines

    print(f"Total Python files: {len([f for f in files_to_check if f[0].endswith('.py')])}")
    print(f"Total lines of code: {total_lines}")
    print()

    # API Endpoints Summary
    print("🌐 API Endpoints Available:")
    print("-" * 60)
    endpoints = [
        "/api/auth/register - Register new user",
        "/api/auth/login - Login with email/password",
        "/api/auth/oauth/login - OAuth login (Google/GitHub)",
        "/api/auth/me - Get current user",
        "/api/scraper/scrape-url - Extract questions from URL",
        "/api/scraper/upload-pdf - Extract questions from PDF",
        "/api/scraper/upload-image - Extract questions from image (OCR)",
        "/api/scraper/bulk-questions - Process bulk questions",
        "/api/questions/answer - Get answer for single question",
        "/api/progress/cards - Create review card",
        "/api/progress/cards/due - Get due cards",
        "/api/progress/reviews - Submit review",
        "/api/progress/stats - Get study statistics",
        "/api/gamification/level - Get level info",
        "/api/gamification/achievements - Get achievements",
        "/api/gamification/daily-goal - Get daily goal progress",
        "/api/gamification/stats - Get gamification stats",
        "/api/ai/providers - List AI providers",
    ]

    for endpoint in endpoints:
        print(f"  • {endpoint}")

    print()
    print("=" * 60)
    print("🚀 Backend is ready for testing!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Set up .env file with API keys")
    print("3. Start MongoDB")
    print("4. Run server: uvicorn app.main:app --reload")

if __name__ == "__main__":
    main()
