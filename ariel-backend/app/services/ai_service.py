from typing import List, Dict, Optional, Any
from app.core.config import settings
import openai
from anthropic import Anthropic
import ollama
import json

class AIService:
    def __init__(self, provider: str = None, api_key: Optional[str] = None, model: Optional[str] = None):
        self.provider = provider or settings.DEFAULT_AI_PROVIDER
        self.api_key = api_key
        self.model = model

        if self.provider == "openai":
            self.api_key = self.api_key or settings.OPENAI_API_KEY
        elif self.provider == "anthropic":
            self.api_key = self.api_key or settings.ANTHROPIC_API_KEY
            if self.api_key:
                self.anthropic_client = Anthropic(api_key=self.api_key)

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
        elif self.provider == "ollama":
            return await self._ollama_generate(prompt)
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
        if len(questions) == 0:
            return []
        if len(questions) > 50:
            raise ValueError("Too many questions. Please limit to 50 at a time.")

        prompt = self._build_batch_prompt(questions, context)

        if self.provider == "openai":
            result = await self._openai_generate(prompt)
        elif self.provider == "anthropic":
            result = await self._anthropic_generate(prompt)
        elif self.provider == "ollama":
            result = await self._ollama_generate(prompt, expect_answers_list=True)
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
        prompt = f"""You are Ariel, a revolutionary learning assistant.

Process these {len(questions)} question(s) and provide EXACTLY {len(questions)} answer(s) in order. No distractors, pure learning.

IMPORTANT: Each numbered item is ONE complete question, even if it spans multiple lines.

Questions:
"""
        for i, q in enumerate(questions, 1):
            prompt += f"\n{i}. {q}\n"

        if context:
            prompt += f"\nContext: {context}\n"

        prompt += f"""\nProvide EXACTLY {len(questions)} answer(s) in this JSON format:
{{
  "answers": [
    {{
      "question_number": 1,
      "answer": "correct answer here",
      "explanation": "brief explanation"
    }}
    {"," if len(questions) > 1 else ""}
    ...
  ]
}}

Remember: Provide EXACTLY {len(questions)} answers, one for each numbered question above.
"""
        return prompt

    async def _openai_generate(self, prompt: str) -> Dict:
        if not self.api_key:
            raise Exception("OpenAI API key not configured")
        model_name = self.model or "gpt-4-turbo-preview"

        try:
            response = await openai.ChatCompletion.acreate(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are Ariel, a positive learning assistant."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                api_key=self.api_key
            )

            return json.loads(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    async def _anthropic_generate(self, prompt: str) -> Dict:
        if not self.api_key:
            raise Exception("Anthropic API key not configured")
        model_name = self.model or "claude-3-5-sonnet-20241022"
        if not hasattr(self, "anthropic_client"):
            self.anthropic_client = Anthropic(api_key=self.api_key)
        try:
            response = self.anthropic_client.messages.create(
                model=model_name,
                max_tokens=2048,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return json.loads(response.content[0].text)
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")

    async def _ollama_generate(self, prompt: str, expect_answers_list: bool = False) -> Dict:
        model_name = self.model or settings.OLLAMA_MODEL
        try:
            response = ollama.chat(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are Ariel, a positive learning assistant. CRITICAL: You MUST respond with ONLY valid JSON. No other text before or after."},
                    {"role": "user", "content": prompt}
                ],
                options={
                    "temperature": 0.3,
                },
                format="json"  # Force JSON output
            )

            content = response['message']['content'].strip()

            # Try to extract JSON if there's extra text
            if not content.startswith('{'):
                # Find first { and last }
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1:
                    content = content[start:end+1]

            try:
                parsed = json.loads(content)
                # Normalize single-answer payloads into answers list if needed
                if expect_answers_list and "answers" not in parsed and "answer" in parsed:
                    parsed = {"answers": [{"answer": parsed.get("answer", ""), "explanation": parsed.get("explanation", "")}]}
                return parsed
            except json.JSONDecodeError:
                # Fallback: create structured response from plain text
                if expect_answers_list:
                    return {
                        "answers": [{
                            "answer": content,
                            "explanation": "AI provided a direct answer without structured format."
                        }]
                    }
                return {
                    "answer": content,
                    "explanation": "AI provided a direct answer without structured format."
                }
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")

    def _parse_batch_response(self, response: Any, expected_count: int) -> List[Dict[str, str]]:
        """Parse batch response and handle various formats"""
        # Ensure we have a list to work with
        answers = []

        if isinstance(response, dict):
            answers = response.get("answers", [])
            # Handle anthropic/openai style nested responses
            if isinstance(answers, dict):
                answers = [answers]
            if not answers and "answer" in response:
                answers = [{"answer": response.get("answer", ""), "explanation": response.get("explanation", "")}]
        elif isinstance(response, list):
            answers = response
        elif isinstance(response, str):
            try:
                data = json.loads(response)
                return self._parse_batch_response(data, expected_count)
            except Exception:
                answers = [{"answer": response, "explanation": ""}]

        # Normalize to expected_count length
        if len(answers) > expected_count:
            merged_answer = " ".join([ans.get("answer", "") for ans in answers])
            merged_explanation = " ".join([ans.get("explanation", "") for ans in answers])
            answers = [{
                "question_number": 1,
                "answer": merged_answer,
                "explanation": merged_explanation
            }]

        if len(answers) < expected_count:
            filler = answers[-1] if answers else {"answer": "Unable to generate answer", "explanation": ""}
            while len(answers) < expected_count:
                answers.append(filler)

        # Ensure all items have consistent keys
        normalized = []
        for idx, ans in enumerate(answers, 1):
            normalized.append({
                "question_number": ans.get("question_number", idx),
                "answer": ans.get("answer", ""),
                "explanation": ans.get("explanation", "")
            })

        return normalized
