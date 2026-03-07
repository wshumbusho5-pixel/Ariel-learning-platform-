"""
Seed demo public flashcards into the database.
Run: python seed_cards.py
"""
import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DATABASE_NAME", "ariel_db")

SEED_CARDS = [
  # Business
  {"subject":"Business","topic":"Economics","question":"What is GDP?","answer":"Gross Domestic Product — the total monetary value of all goods and services produced in a country in a given period.","visibility":"public"},
  {"subject":"Business","topic":"Marketing","question":"What is the 4P marketing mix?","answer":"Product, Price, Place, Promotion — the four key elements of a marketing strategy.","visibility":"public"},
  {"subject":"Business","topic":"Finance","question":"What is compound interest?","answer":"Interest calculated on both the initial principal and the accumulated interest from previous periods.","visibility":"public"},
  {"subject":"Business","topic":"Strategy","question":"What is a SWOT analysis?","answer":"A framework to evaluate Strengths, Weaknesses, Opportunities, and Threats of a business or project.","visibility":"public"},
  {"subject":"Business","topic":"Accounting","question":"What is the accounting equation?","answer":"Assets = Liabilities + Equity","visibility":"public"},
  # Technology
  {"subject":"Technology","topic":"Programming","question":"What does HTTP stand for?","answer":"HyperText Transfer Protocol — the foundation of data communication on the web.","visibility":"public"},
  {"subject":"Technology","topic":"Programming","question":"What is a REST API?","answer":"Representational State Transfer — an architectural style for designing networked applications using HTTP methods.","visibility":"public"},
  {"subject":"Technology","topic":"AI","question":"What is machine learning?","answer":"A subset of AI where systems learn from data to improve performance without being explicitly programmed.","visibility":"public"},
  {"subject":"Technology","topic":"Database","question":"What is SQL?","answer":"Structured Query Language — used to manage and query relational databases.","visibility":"public"},
  {"subject":"Technology","topic":"Networks","question":"What is an IP address?","answer":"A unique numerical label assigned to each device connected to a network, used for identification and location addressing.","visibility":"public"},
  # Mathematics
  {"subject":"Mathematics","topic":"Calculus","question":"What is a derivative?","answer":"A measure of how a function changes as its input changes — the instantaneous rate of change.","visibility":"public"},
  {"subject":"Mathematics","topic":"Algebra","question":"What is the quadratic formula?","answer":"x = (−b ± √(b²−4ac)) / 2a — used to solve quadratic equations ax²+bx+c=0.","visibility":"public"},
  {"subject":"Mathematics","topic":"Statistics","question":"What is the mean?","answer":"The average of a set of numbers, calculated by dividing the sum by the count.","visibility":"public"},
  {"subject":"Mathematics","topic":"Geometry","question":"What is the Pythagorean theorem?","answer":"a² + b² = c² — relates the lengths of sides in a right-angled triangle.","visibility":"public"},
  {"subject":"Mathematics","topic":"Probability","question":"What is probability?","answer":"A measure of the likelihood an event will occur, expressed as a number between 0 and 1.","visibility":"public"},
  # Sciences
  {"subject":"Sciences","topic":"Biology","question":"What is DNA?","answer":"Deoxyribonucleic acid — the molecule that carries genetic information in living organisms.","visibility":"public"},
  {"subject":"Sciences","topic":"Chemistry","question":"What is the periodic table?","answer":"A tabular arrangement of chemical elements ordered by atomic number, electron configuration, and chemical properties.","visibility":"public"},
  {"subject":"Sciences","topic":"Physics","question":"What is Newton's second law?","answer":"F = ma — force equals mass times acceleration.","visibility":"public"},
  {"subject":"Sciences","topic":"Biology","question":"What is photosynthesis?","answer":"The process by which plants use sunlight, water, and CO₂ to produce glucose and oxygen.","visibility":"public"},
  {"subject":"Sciences","topic":"Chemistry","question":"What is a chemical bond?","answer":"An attraction between atoms that allows the formation of chemical compounds. Types include covalent, ionic, and metallic.","visibility":"public"},
  # History
  {"subject":"History","topic":"World Wars","question":"When did World War II end?","answer":"1945 — Germany surrendered on May 8 (V-E Day), Japan on September 2 (V-J Day).","visibility":"public"},
  {"subject":"History","topic":"Ancient History","question":"What was the Roman Empire?","answer":"One of the largest empires in ancient history, at its peak covering much of Europe, North Africa, and the Middle East (27 BC – 476 AD).","visibility":"public"},
  {"subject":"History","topic":"Modern History","question":"What was the Cold War?","answer":"A period of geopolitical tension (1947–1991) between the United States and Soviet Union, characterized by ideological conflict without direct military conflict.","visibility":"public"},
  # Psychology
  {"subject":"Psychology","topic":"Cognitive","question":"What is cognitive dissonance?","answer":"The mental discomfort experienced when holding two or more contradictory beliefs, values, or attitudes simultaneously.","visibility":"public"},
  {"subject":"Psychology","topic":"Behavioral","question":"What is classical conditioning?","answer":"A learning process where a neutral stimulus becomes associated with a meaningful stimulus, producing a conditioned response (Pavlov's dogs).","visibility":"public"},
  {"subject":"Psychology","topic":"Developmental","question":"What is Maslow's hierarchy of needs?","answer":"A motivational theory showing human needs in 5 levels: physiological, safety, love/belonging, esteem, and self-actualization.","visibility":"public"},
  # Economics
  {"subject":"Economics","topic":"Microeconomics","question":"What is supply and demand?","answer":"An economic model describing how price is determined by the relationship between the availability of a product and the desire for it.","visibility":"public"},
  {"subject":"Economics","topic":"Macroeconomics","question":"What is inflation?","answer":"The rate at which the general level of prices for goods and services rises, eroding purchasing power over time.","visibility":"public"},
  {"subject":"Economics","topic":"Trade","question":"What is comparative advantage?","answer":"A country's ability to produce a good at a lower opportunity cost than another country, forming the basis for international trade.","visibility":"public"},
  # Health
  {"subject":"Health","topic":"Nutrition","question":"What are macronutrients?","answer":"The three main categories of nutrients: carbohydrates, proteins, and fats — providing energy and supporting body functions.","visibility":"public"},
  {"subject":"Health","topic":"Medicine","question":"What is the immune system?","answer":"The body's defense mechanism against pathogens — a network of cells, tissues, and organs working together to protect against infection.","visibility":"public"},
]

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db["cards"]

    inserted = 0
    skipped = 0
    for card in SEED_CARDS:
        existing = await collection.find_one({"question": card["question"]})
        if existing:
            skipped += 1
            continue
        doc = {
            **card,
            "tags": [card["subject"].lower(), card["topic"].lower()],
            "likes": 0,
            "saves": 0,
            "comments_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": None,
        }
        await collection.insert_one(doc)
        inserted += 1

    client.close()
    print(f"Seeded {inserted} cards, skipped {skipped} duplicates.")

if __name__ == "__main__":
    asyncio.run(seed())
