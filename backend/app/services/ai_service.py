import json
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

client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version=AZURE_OPENAI_API_VERSION,
)

def _extract_json(text: str) -> dict:
    # Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
    text = re.sub(r"```(?:json)?\s*", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end+1])
        raise ValueError("Model did not return valid JSON.")
    
def generate_breakdown(text: str, support_mode: str) -> dict:
    prompt = build_breakdown_prompt(text, support_mode)

    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    output_text = response.choices[0].message.content
    if not output_text:
        raise ValueError("Model returned an empty response.")
    return _extract_json(output_text)

def generate_focus_session(step_text: str, support_mode: str) -> dict:
    prompt = build_focus_prompt(step_text, support_mode)

    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    output_text = response.choices[0].message.content
    if not output_text:
        raise ValueError("Model returned an empty response.")
    return _extract_json(output_text)

def generate_simplified_text(text: str, support_mode: str) -> dict:
    prompt = build_simplify_prompt(text, support_mode)

    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    output_text = response.choices[0].message.content
    if not output_text:
        raise ValueError("Model returned an empty response.")
    return _extract_json(output_text)