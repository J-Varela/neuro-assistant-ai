import json
import logging
import re
from openai import AzureOpenAI

from app.core.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT_MODEL,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION,
)
from app.services.prompt_builder import (
    build_breakdown_prompt,
    build_simplify_prompt,
    build_focus_prompt,
)

logger = logging.getLogger(__name__)

_client: AzureOpenAI | None = None


def _get_client() -> AzureOpenAI:
    global _client
    if _client is None:
        _client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
            timeout=30.0,
        )
    return _client

_BREAKDOWN_KEYS = {"goal", "steps", "next_step", "estimated_effort"}
_SIMPLIFY_KEYS = {"simplified_text", "key_points", "action_items"}
_FOCUS_KEYS = {"supportive_prompt"}


def _extract_json(text: str) -> dict:
    # Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: extract substring between outermost { and }
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            logger.warning("Primary JSON parse failed; attempting brace-extraction fallback.")
            return json.loads(cleaned[start : end + 1])
        raise ValueError(f"Model did not return valid JSON. Raw output: {text[:200]!r}")


def _validate_keys(data: dict, required: set, context: str) -> None:
    missing = required - set(data.keys())
    if missing:
        raise ValueError(f"{context}: AI response missing required fields: {missing}")


def generate_breakdown(text: str, support_mode: str) -> dict:
    prompt = build_breakdown_prompt(text, support_mode)
    response = _get_client().chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    output_text = response.choices[0].message.content
    if not output_text:
        raise ValueError("Model returned an empty response.")
    data = _extract_json(output_text)
    _validate_keys(data, _BREAKDOWN_KEYS, "breakdown")
    return data


def generate_focus_session(step_text: str, support_mode: str) -> dict:
    prompt = build_focus_prompt(step_text, support_mode)
    response = _get_client().chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    output_text = response.choices[0].message.content
    if not output_text:
        raise ValueError("Model returned an empty response.")
    data = _extract_json(output_text)
    _validate_keys(data, _FOCUS_KEYS, "focus")
    return data


def generate_simplified_text(text: str, support_mode: str) -> dict:
    prompt = build_simplify_prompt(text, support_mode)
    response = _get_client().chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    output_text = response.choices[0].message.content
    if not output_text:
        raise ValueError("Model returned an empty response.")
    data = _extract_json(output_text)
    _validate_keys(data, _SIMPLIFY_KEYS, "simplify")
    return data