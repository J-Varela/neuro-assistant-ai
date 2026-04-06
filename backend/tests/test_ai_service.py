"""Unit tests for AI service helpers — no network calls, no database."""
import pytest

from app.services.ai_service import _extract_json, _validate_keys


# --- _extract_json ---

def test_extract_json_clean_object():
    assert _extract_json('{"key": "value"}') == {"key": "value"}


def test_extract_json_with_json_fence():
    raw = '```json\n{"goal": "Do something"}\n```'
    assert _extract_json(raw) == {"goal": "Do something"}


def test_extract_json_with_plain_fence():
    raw = "```\n{\"steps\": [\"a\", \"b\"]}\n```"
    assert _extract_json(raw) == {"steps": ["a", "b"]}


def test_extract_json_fallback_with_surrounding_text():
    raw = 'Sure! Here you go: {"answer": 42} Hope that helps!'
    assert _extract_json(raw) == {"answer": 42}


def test_extract_json_invalid_raises():
    with pytest.raises(ValueError, match="valid JSON"):
        _extract_json("This is not JSON at all.")


def test_extract_json_empty_raises():
    with pytest.raises(ValueError):
        _extract_json("")


# --- _validate_keys ---

def test_validate_keys_all_present():
    data = {"goal": "x", "steps": [], "next_step": "y", "estimated_effort": "z"}
    _validate_keys(data, {"goal", "steps", "next_step", "estimated_effort"}, "breakdown")


def test_validate_keys_missing_field():
    with pytest.raises(ValueError, match="missing required fields"):
        _validate_keys({"goal": "x"}, {"goal", "steps"}, "breakdown")


def test_validate_keys_extra_fields_are_ok():
    # Extra keys in the response should not cause failures
    data = {"goal": "x", "steps": [], "next_step": "y", "estimated_effort": "z", "bonus": "extra"}
    _validate_keys(data, {"goal", "steps", "next_step", "estimated_effort"}, "breakdown")
