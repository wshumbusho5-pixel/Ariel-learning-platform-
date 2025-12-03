from typing import List, Dict, Optional
from app.core.config import settings
import openai
from anthropic import Anthropic

class AIService:
    def __init__(self, provider: str = None):
        self.provider = provider or settings.DEFAULT_AI_PROVIDER

        if self.provider == "openai" and settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        elif self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def generate_answer(
        self,
        question: str,
        context: Optional[str] = None,
        include_explanation: bool = True,
        detailed: bool = False
    ) -> Dict[str, str]:
        """
        Generate answer for a single question using AI.
        Returns dict with 'answer', 'explanation', and 'detailed_explanation'
        """
        prompt = self._build_prompt(question, context, include_explanation, detailed)

        if self.provider == "openai":
            return await self._openai_generate(prompt)
        elif self.provider == "anthropic":
            return await self._anthropic_generate(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    async def generate_answers_batch(
        self,
        questions: List[str],
        context: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """
        Generate answers for multiple questions in batch.
        More efficient for processing many questions at once.
        """
        prompt = self._build_batch_prompt(questions, context)

        if self.provider == "openai":
            result = await self._openai_generate(prompt)
        elif self.provider == "anthropic":
            result = await self._anthropic_generate(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

        return self._parse_batch_response(result, len(questions))

    def _build_prompt(
        self,
        question: str,
        context: Optional[str],
        include_explanation: bool,
        detailed: bool
    ) -> str:
        base_prompt = f"""You are Ariel, a revolutionary learning assistant focused on positive reinforcement.

Your task: Provide ONLY the correct answer to the question below. No multiple choice options, no distractors.

Question: {question}
"""

        if context:
            base_prompt += f"\nContext: {context}\n"

        if include_explanation:
            base_prompt += "\nProvide your response in this JSON format:\n"
            base_prompt += "{\n"
            base_prompt += '  "answer": "the correct answer",\n'
            base_prompt += '  "explanation": "brief 1-sentence explanation",\n'
            if detailed:
                base_prompt += '  "detailed_explanation": "comprehensive explanation with steps"\n'
            base_prompt += "}\n"
        else:
            base_prompt += '\nProvide only the answer in JSON format: {"answer": "your answer"}\n'

        return base_prompt

    def _build_batch_prompt(self, questions: List[str], context: Optional[str]) -> str:
        prompt = """You are Ariel, a revolutionary learning assistant.

Process these questions and provide ONLY correct answers in order. No distractors, pure learning.

Questions:
"""
        for i, q in enumerate(questions, 1):
            prompt += f"{i}. {q}\n"

        if context:
            prompt += f"\nContext: {context}\n"

        prompt += """\nProvide answers in this JSON format:
{
  "answers": [
    {
      "question_number": 1,
      "answer": "correct answer here",
      "explanation": "brief explanation"
    },
    ...
  ]
}
"""
        return prompt

    async def _openai_generate(self, prompt: str) -> Dict:
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are Ariel, a positive learning assistant."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    async def _anthropic_generate(self, prompt: str) -> Dict:
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            import json
            return json.loads(response.content[0].text)
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")

    def _parse_batch_response(self, response: Dict, expected_count: int) -> List[Dict[str, str]]:
        """Parse batch response and ensure we have all answers"""
        answers = response.get("answers", [])

        if len(answers) != expected_count:
            raise ValueError(f"Expected {expected_count} answers, got {len(answers)}")

        return answers
