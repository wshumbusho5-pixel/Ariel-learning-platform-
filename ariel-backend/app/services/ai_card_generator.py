from typing import List, Dict, Optional
from app.models.user import User, EducationLevel
from app.models.card import Card, CardCreate, CardVisibility
from app.services.card_repository import CardRepository
import openai
import os
from datetime import datetime

class AICardGenerator:
    """
    Generates personalized flashcards based on user's education profile.
    Uses OpenAI GPT-4 to create curriculum-specific content.
    """

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key

    @staticmethod
    def get_curriculum_level(education_level: EducationLevel, year_level: str) -> str:
        """Convert education level and year to curriculum description"""
        if education_level == EducationLevel.HIGH_SCHOOL:
            return f"High School {year_level} level curriculum"
        elif education_level == EducationLevel.UNIVERSITY:
            return f"University {year_level} level curriculum"
        elif education_level == EducationLevel.PROFESSIONAL:
            return "Professional/Industry level"
        else:
            return "Self-study enthusiast level"

    @staticmethod
    def build_generation_prompt(
        subject: str,
        curriculum_level: str,
        learning_goals: List[str],
        topic: Optional[str] = None,
        num_cards: int = 10
    ) -> str:
        """Build AI prompt for card generation"""

        goals_text = ", ".join(learning_goals) if learning_goals else "general understanding"
        topic_text = f" focusing on {topic}" if topic else ""

        prompt = f"""Generate {num_cards} educational flashcards for {subject}{topic_text} at {curriculum_level}.

The student's learning goals are: {goals_text}

For each flashcard, provide:
1. A clear, specific question
2. A comprehensive answer
3. A brief explanation with context or examples

Format your response as a JSON array with this structure:
[
  {{
    "question": "Clear question here?",
    "answer": "Concise answer here",
    "explanation": "Brief explanation with context and examples",
    "topic": "Specific topic within {subject}"
  }}
]

Guidelines:
- Questions should be challenging but appropriate for the curriculum level
- Answers should be clear and accurate
- Explanations should help deepen understanding
- Cover diverse topics within {subject}
- Focus on {goals_text}
- Make cards engaging and practical
- Use real-world examples when possible

Generate the flashcards now:"""

        return prompt

    async def generate_cards_for_subject(
        self,
        user: User,
        subject: str,
        num_cards: int = 10,
        topic: Optional[str] = None
    ) -> List[Card]:
        """
        Generate flashcards for a specific subject based on user profile.

        Args:
            user: User object with education profile
            subject: Subject to generate cards for
            num_cards: Number of cards to generate
            topic: Optional specific topic within subject

        Returns:
            List of created Card objects
        """

        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")

        # Get curriculum level
        curriculum_level = self.get_curriculum_level(
            user.education_level,
            user.year_level or "General"
        )

        # Build prompt
        prompt = self.build_generation_prompt(
            subject=subject,
            curriculum_level=curriculum_level,
            learning_goals=user.learning_goals or [],
            topic=topic,
            num_cards=num_cards
        )

        # Call OpenAI API
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educator who creates high-quality educational flashcards. You understand various curriculum levels and learning styles. Always respond with valid JSON arrays."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )

            # Parse response
            import json
            cards_data = json.loads(response.choices[0].message.content)

            # Create CardCreate objects
            card_creates = []
            for card_data in cards_data:
                card_create = CardCreate(
                    question=card_data["question"],
                    answer=card_data["answer"],
                    explanation=card_data.get("explanation"),
                    subject=subject,
                    topic=card_data.get("topic", topic),
                    tags=[subject, curriculum_level],
                    visibility=CardVisibility.PRIVATE
                )
                card_creates.append(card_create)

            # Save to database
            cards = await CardRepository.create_cards_bulk(card_creates, user.id)

            return cards

        except Exception as e:
            print(f"Error generating cards: {str(e)}")
            raise

    async def generate_daily_cards(self, user: User, cards_per_subject: int = 5) -> Dict[str, List[Card]]:
        """
        Generate daily personalized cards for all user's subjects.

        Args:
            user: User object with education profile
            cards_per_subject: Number of cards to generate per subject

        Returns:
            Dict mapping subject to list of generated cards
        """

        if not user.subjects:
            return {}

        results = {}

        for subject in user.subjects:
            try:
                cards = await self.generate_cards_for_subject(
                    user=user,
                    subject=subject,
                    num_cards=cards_per_subject
                )
                results[subject] = cards
            except Exception as e:
                print(f"Failed to generate cards for {subject}: {str(e)}")
                results[subject] = []

        return results

    async def generate_exam_prep_cards(
        self,
        user: User,
        subject: str,
        exam_date: Optional[datetime] = None,
        num_cards: int = 20
    ) -> List[Card]:
        """
        Generate exam preparation cards with increased difficulty.

        Args:
            user: User object
            subject: Subject for exam prep
            exam_date: Optional exam date for time-based preparation
            num_cards: Number of cards to generate

        Returns:
            List of exam prep cards
        """

        curriculum_level = self.get_curriculum_level(
            user.education_level,
            user.year_level or "General"
        )

        days_until_exam = ""
        if exam_date:
            days = (exam_date - datetime.utcnow()).days
            days_until_exam = f" The exam is in {days} days."

        prompt = f"""Generate {num_cards} exam preparation flashcards for {subject} at {curriculum_level}.{days_until_exam}

Focus on:
- Common exam questions and topics
- Difficult concepts that students often struggle with
- Important formulas, definitions, and key facts
- Application-based questions
- Critical thinking and analysis

Format your response as a JSON array with this structure:
[
  {{
    "question": "Exam-style question here?",
    "answer": "Detailed answer here",
    "explanation": "Strategy and key points to remember",
    "topic": "Specific topic",
    "difficulty": "medium/hard"
  }}
]

Make these cards challenging and exam-focused. Generate now:"""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert exam preparation tutor. You create challenging flashcards that prepare students for real exam scenarios."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=3000
            )

            import json
            cards_data = json.loads(response.choices[0].message.content)

            card_creates = []
            for card_data in cards_data:
                card_create = CardCreate(
                    question=card_data["question"],
                    answer=card_data["answer"],
                    explanation=card_data.get("explanation"),
                    subject=subject,
                    topic=card_data.get("topic", "Exam Prep"),
                    tags=[subject, "exam-prep", curriculum_level],
                    visibility=CardVisibility.PRIVATE
                )
                card_creates.append(card_create)

            cards = await CardRepository.create_cards_bulk(card_creates, user.id)
            return cards

        except Exception as e:
            print(f"Error generating exam prep cards: {str(e)}")
            raise

# Global instance
ai_card_generator = AICardGenerator()
