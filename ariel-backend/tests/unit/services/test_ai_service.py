"""
Unit tests for AIService.

Tests AI provider initialization, prompt building, answer generation,
batch processing, and response parsing with mocked external APIs.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json

from app.services.ai_service import AIService


# ===== INITIALIZATION TESTS =====

@pytest.mark.unit
def test_init_default_provider():
    """Test AIService initialization with default provider"""
    service = AIService()
    assert service.provider is not None
    assert service.api_key is None or isinstance(service.api_key, str)


@pytest.mark.unit
def test_init_openai_provider():
    """Test AIService initialization with OpenAI provider"""
    service = AIService(provider="openai", api_key="test-key")
    assert service.provider == "openai"
    assert service.api_key == "test-key"


@pytest.mark.unit
def test_init_anthropic_provider():
    """Test AIService initialization with Anthropic provider"""
    service = AIService(provider="anthropic", api_key="test-key")
    assert service.provider == "anthropic"
    assert service.api_key == "test-key"
    assert hasattr(service, "anthropic_client")


@pytest.mark.unit
def test_init_ollama_provider():
    """Test AIService initialization with Ollama provider (local)"""
    service = AIService(provider="ollama")
    assert service.provider == "ollama"
    # Ollama doesn't require API key
    assert service.api_key is None


@pytest.mark.unit
def test_init_custom_model():
    """Test AIService initialization with custom model"""
    service = AIService(provider="openai", api_key="test-key", model="gpt-4")
    assert service.model == "gpt-4"


# ===== PROMPT BUILDING TESTS =====

@pytest.mark.unit
def test_build_prompt_basic():
    """Test building basic prompt without context or explanation"""
    service = AIService(provider="openai")
    prompt = service._build_prompt("What is 2+2?", None, False, False)

    assert "What is 2+2?" in prompt
    assert "Ariel" in prompt
    assert "answer" in prompt.lower()


@pytest.mark.unit
def test_build_prompt_with_context():
    """Test building prompt with context"""
    service = AIService(provider="openai")
    prompt = service._build_prompt(
        "What is the capital?",
        "France is a country in Europe",
        True,
        False
    )

    assert "What is the capital?" in prompt
    assert "France is a country in Europe" in prompt
    assert "Context:" in prompt


@pytest.mark.unit
def test_build_prompt_with_explanation():
    """Test building prompt with explanation"""
    service = AIService(provider="openai")
    prompt = service._build_prompt("What is gravity?", None, True, False)

    assert "explanation" in prompt
    assert "JSON" in prompt


@pytest.mark.unit
def test_build_prompt_with_detailed_explanation():
    """Test building prompt with detailed explanation"""
    service = AIService(provider="openai")
    prompt = service._build_prompt("Explain photosynthesis", None, True, True)

    assert "detailed_explanation" in prompt
    assert "comprehensive" in prompt or "steps" in prompt


@pytest.mark.unit
def test_build_batch_prompt_single_question():
    """Test building batch prompt with single question"""
    service = AIService(provider="openai")
    prompt = service._build_batch_prompt(["What is Python?"], None)

    assert "1. What is Python?" in prompt
    assert "EXACTLY 1" in prompt
    assert "answers" in prompt


@pytest.mark.unit
def test_build_batch_prompt_multiple_questions():
    """Test building batch prompt with multiple questions"""
    service = AIService(provider="openai")
    questions = [
        "What is Python?",
        "What is JavaScript?",
        "What is Rust?"
    ]
    prompt = service._build_batch_prompt(questions, None)

    assert "1. What is Python?" in prompt
    assert "2. What is JavaScript?" in prompt
    assert "3. What is Rust?" in prompt
    assert "EXACTLY 3" in prompt


@pytest.mark.unit
def test_build_batch_prompt_with_context():
    """Test building batch prompt with context"""
    service = AIService(provider="openai")
    prompt = service._build_batch_prompt(
        ["What is the capital?"],
        "We're discussing France"
    )

    assert "Context: We're discussing France" in prompt


# ===== GENERATE ANSWER TESTS (MOCKED) =====

@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answer_openai_success():
    """Test successful answer generation with OpenAI"""
    service = AIService(provider="openai", api_key="test-key")

    # Mock the _openai_generate method directly
    async def mock_openai_generate(prompt):
        return {
            "answer": "Paris",
            "explanation": "Paris is the capital of France."
        }

    with patch.object(service, "_openai_generate", side_effect=mock_openai_generate):
        result = await service.generate_answer("What is the capital of France?")

    assert result["answer"] == "Paris"
    assert "explanation" in result


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answer_anthropic_success():
    """Test successful answer generation with Anthropic"""
    service = AIService(provider="anthropic", api_key="test-key")

    # Mock the _anthropic_generate method directly
    async def mock_anthropic_generate(prompt):
        return {
            "answer": "Paris",
            "explanation": "Paris is the capital of France."
        }

    with patch.object(service, "_anthropic_generate", side_effect=mock_anthropic_generate):
        result = await service.generate_answer("What is the capital of France?")

    assert result["answer"] == "Paris"
    assert "explanation" in result


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answer_ollama_success():
    """Test successful answer generation with Ollama"""
    service = AIService(provider="ollama")

    mock_response = {
        "message": {
            "content": json.dumps({
                "answer": "Paris",
                "explanation": "Paris is the capital of France."
            })
        }
    }

    with patch("ollama.chat", return_value=mock_response):
        result = await service.generate_answer("What is the capital of France?")

    assert result["answer"] == "Paris"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answer_unsupported_provider():
    """Test error with unsupported provider"""
    service = AIService(provider="invalid", api_key="test-key")

    with pytest.raises(ValueError, match="Unsupported AI provider"):
        await service.generate_answer("Test question")


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answer_no_api_key_openai():
    """Test error when OpenAI API key is missing"""
    service = AIService(provider="openai", api_key=None)

    with pytest.raises(Exception, match="OpenAI API key not configured"):
        await service.generate_answer("Test question")


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answer_no_api_key_anthropic():
    """Test error when Anthropic API key is missing"""
    service = AIService(provider="anthropic", api_key=None)

    with pytest.raises(Exception, match="Anthropic API key not configured"):
        await service.generate_answer("Test question")


# ===== BATCH GENERATION TESTS =====

@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answers_batch_empty_list():
    """Test batch generation with empty question list"""
    service = AIService(provider="openai", api_key="test-key")

    result = await service.generate_answers_batch([])

    assert result == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answers_batch_too_many_questions():
    """Test batch generation fails with >50 questions"""
    service = AIService(provider="openai", api_key="test-key")

    questions = [f"Question {i}" for i in range(51)]

    with pytest.raises(ValueError, match="Too many questions"):
        await service.generate_answers_batch(questions)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_answers_batch_success():
    """Test successful batch generation"""
    service = AIService(provider="openai", api_key="test-key")

    # Mock the _openai_generate method directly
    async def mock_openai_generate(prompt):
        return {
            "answers": [
                {"question_number": 1, "answer": "Python", "explanation": "Programming language"},
                {"question_number": 2, "answer": "JavaScript", "explanation": "Web language"}
            ]
        }

    with patch.object(service, "_openai_generate", side_effect=mock_openai_generate):
        result = await service.generate_answers_batch(["What is Python?", "What is JavaScript?"])

    assert len(result) == 2
    assert result[0]["answer"] == "Python"
    assert result[1]["answer"] == "JavaScript"


# ===== RESPONSE PARSING TESTS =====

@pytest.mark.unit
def test_parse_batch_response_dict_with_answers():
    """Test parsing batch response from dict with answers array"""
    service = AIService(provider="openai")

    response = {
        "answers": [
            {"answer": "Answer 1", "explanation": "Explanation 1"},
            {"answer": "Answer 2", "explanation": "Explanation 2"}
        ]
    }

    result = service._parse_batch_response(response, 2)

    assert len(result) == 2
    assert result[0]["answer"] == "Answer 1"
    assert result[1]["answer"] == "Answer 2"


@pytest.mark.unit
def test_parse_batch_response_single_answer():
    """Test parsing batch response from single answer dict"""
    service = AIService(provider="openai")

    response = {
        "answer": "Single answer",
        "explanation": "Single explanation"
    }

    result = service._parse_batch_response(response, 1)

    assert len(result) == 1
    assert result[0]["answer"] == "Single answer"


@pytest.mark.unit
def test_parse_batch_response_list():
    """Test parsing batch response from list"""
    service = AIService(provider="openai")

    response = [
        {"answer": "Answer 1", "explanation": "Exp 1"},
        {"answer": "Answer 2", "explanation": "Exp 2"}
    ]

    result = service._parse_batch_response(response, 2)

    assert len(result) == 2
    assert result[0]["answer"] == "Answer 1"


@pytest.mark.unit
def test_parse_batch_response_string():
    """Test parsing batch response from JSON string"""
    service = AIService(provider="openai")

    response = json.dumps({
        "answers": [
            {"answer": "Answer 1", "explanation": "Exp 1"}
        ]
    })

    result = service._parse_batch_response(response, 1)

    assert len(result) == 1
    assert result[0]["answer"] == "Answer 1"


@pytest.mark.unit
def test_parse_batch_response_too_few_answers():
    """Test parsing fills missing answers"""
    service = AIService(provider="openai")

    response = {
        "answers": [
            {"answer": "Answer 1", "explanation": "Exp 1"}
        ]
    }

    result = service._parse_batch_response(response, 3)

    # Should fill to 3 answers using the last answer as filler
    assert len(result) == 3
    assert result[0]["answer"] == "Answer 1"
    assert result[1]["answer"] == "Answer 1"  # Filler
    assert result[2]["answer"] == "Answer 1"  # Filler


@pytest.mark.unit
def test_parse_batch_response_too_many_answers():
    """Test parsing merges extra answers"""
    service = AIService(provider="openai")

    response = {
        "answers": [
            {"answer": "A1", "explanation": "E1"},
            {"answer": "A2", "explanation": "E2"},
            {"answer": "A3", "explanation": "E3"}
        ]
    }

    result = service._parse_batch_response(response, 1)

    # Should merge all answers into one
    assert len(result) == 1
    assert "A1" in result[0]["answer"]
    assert "A2" in result[0]["answer"]
    assert "A3" in result[0]["answer"]


@pytest.mark.unit
def test_parse_batch_response_normalizes_keys():
    """Test parsing normalizes all answer dicts to have consistent keys"""
    service = AIService(provider="openai")

    response = {
        "answers": [
            {"answer": "A1"},  # Missing explanation
            {"answer": "A2", "explanation": "E2", "extra_key": "ignored"}
        ]
    }

    result = service._parse_batch_response(response, 2)

    assert len(result) == 2
    assert "question_number" in result[0]
    assert "answer" in result[0]
    assert "explanation" in result[0]
    assert result[0]["explanation"] == ""  # Filled in
    assert "extra_key" not in result[1]  # Normalized out
