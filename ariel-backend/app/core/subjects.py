"""
Canonical subject system for Ariel Learning Platform.

All subject fields on cards, decks, and users are stored as one of the
CANONICAL_SUBJECTS values below. The normalize_subject() function maps
any incoming string (user input, scraped text, seed data) to the correct
canonical form before it touches the database.
"""
from typing import Optional

# The only valid subject values in the database.
CANONICAL_SUBJECTS = [
    "Mathematics",
    "Sciences",
    "Technology",
    "History",
    "Literature",
    "Economics",
    "Languages",
    "Health",
    "Psychology",
    "Geography",
    "Gospel",
    "Business",
    "Law",
    "Arts",
    "Engineering",
    "General",
]

# Every known alias → its canonical form (all keys are lowercase).
_ALIAS_MAP: dict[str, str] = {
    # Mathematics
    "math": "Mathematics",
    "maths": "Mathematics",
    "mathematics": "Mathematics",
    "calculus": "Mathematics",
    "algebra": "Mathematics",
    "geometry": "Mathematics",
    "statistics": "Mathematics",
    "trigonometry": "Mathematics",
    "discrete math": "Mathematics",
    "linear algebra": "Mathematics",
    # Sciences
    "sciences": "Sciences",
    "science": "Sciences",
    "biology": "Sciences",
    "bio": "Sciences",
    "chemistry": "Sciences",
    "chem": "Sciences",
    "physics": "Sciences",
    "phys": "Sciences",
    "lab": "Sciences",
    "ecology": "Sciences",
    "genetics": "Sciences",
    "biochemistry": "Sciences",
    "organic chemistry": "Sciences",
    "life science": "Sciences",
    # Technology
    "technology": "Technology",
    "tech": "Technology",
    "computer science": "Technology",
    "cs": "Technology",
    "coding": "Technology",
    "programming": "Technology",
    "software": "Technology",
    "it": "Technology",
    "data science": "Technology",
    "machine learning": "Technology",
    "ai": "Technology",
    "cybersecurity": "Technology",
    "web development": "Technology",
    "javascript": "Technology",
    "python": "Technology",
    # History
    "history": "History",
    "historical": "History",
    "world war": "History",
    "ancient history": "History",
    "civilization": "History",
    "medieval": "History",
    # Literature
    "literature": "Literature",
    "english": "Literature",
    "writing": "Literature",
    "poetry": "Literature",
    "grammar": "Literature",
    "essay writing": "Literature",
    "reading": "Literature",
    "lang arts": "Literature",
    "language arts": "Literature",
    "shakespeare": "Literature",
    # Economics
    "economics": "Economics",
    "economy": "Economics",
    "macroeconomics": "Economics",
    "microeconomics": "Economics",
    "gdp": "Economics",
    "trade": "Economics",
    "monetary policy": "Economics",
    "fiscal policy": "Economics",
    "stock market": "Economics",
    # Languages
    "languages": "Languages",
    "language": "Languages",
    "french": "Languages",
    "spanish": "Languages",
    "swahili": "Languages",
    "kinyarwanda": "Languages",
    "mandarin": "Languages",
    "german": "Languages",
    "italian": "Languages",
    "japanese": "Languages",
    "arabic": "Languages",
    "foreign language": "Languages",
    # Health
    "health": "Health",
    "medicine": "Health",
    "medical": "Health",
    "anatomy": "Health",
    "nutrition": "Health",
    "fitness": "Health",
    "pharmacology": "Health",
    "nursing": "Health",
    "physiology": "Health",
    "mental health": "Health",
    "health & medicine": "Health",
    "health and medicine": "Health",
    # Psychology
    "psychology": "Psychology",
    "psych": "Psychology",
    "cognitive psychology": "Psychology",
    "behavioral psychology": "Psychology",
    "therapy": "Psychology",
    "neuroscience": "Psychology",
    # Geography
    "geography": "Geography",
    "geo": "Geography",
    "maps": "Geography",
    "climate": "Geography",
    "geopolitics": "Geography",
    "physical geography": "Geography",
    "human geography": "Geography",
    # Gospel
    "gospel": "Gospel",
    "bible": "Gospel",
    "theology": "Gospel",
    "faith": "Gospel",
    "religion": "Gospel",
    "church": "Gospel",
    "scripture": "Gospel",
    "christianity": "Gospel",
    "gospel & faith": "Gospel",
    # Business
    "business": "Business",
    "marketing": "Business",
    "finance": "Business",
    "accounting": "Business",
    "management": "Business",
    "entrepreneurship": "Business",
    "strategy": "Business",
    "sales": "Business",
    "corporate finance": "Business",
    # Law
    "law": "Law",
    "legal": "Law",
    "constitutional law": "Law",
    "criminal law": "Law",
    "contract law": "Law",
    "human rights": "Law",
    "international law": "Law",
    # Arts
    "arts": "Arts",
    "art": "Arts",
    "music": "Arts",
    "design": "Arts",
    "visual arts": "Arts",
    "photography": "Arts",
    "film": "Arts",
    "creative": "Arts",
    "arts & music": "Arts",
    "music theory": "Arts",
    "art history": "Arts",
    # Engineering
    "engineering": "Engineering",
    "mechanical engineering": "Engineering",
    "electrical engineering": "Engineering",
    "civil engineering": "Engineering",
    "thermodynamics": "Engineering",
    "circuit analysis": "Engineering",
    "structural engineering": "Engineering",
    # General fallback
    "general": "General",
    "general knowledge": "General",
    "other": "General",
    "misc": "General",
}


def normalize_subject(subject: Optional[str]) -> str:
    """
    Map any subject string to a canonical value.

    Strategy:
      1. Exact lookup in alias map (lowercase)
      2. Partial-match scan — first alias found wins
      3. Title-case check against canonical list
      4. Fallback to "General"
    """
    if not subject:
        return "General"

    s = subject.strip().lower()

    # 1. Exact match
    if s in _ALIAS_MAP:
        return _ALIAS_MAP[s]

    # 2. Partial match — longer aliases checked first to prevent false positives
    for alias in sorted(_ALIAS_MAP, key=len, reverse=True):
        if alias in s:
            return _ALIAS_MAP[alias]

    # 3. Already canonical but wrong case?
    title = subject.strip().title()
    if title in CANONICAL_SUBJECTS:
        return title

    return "General"
