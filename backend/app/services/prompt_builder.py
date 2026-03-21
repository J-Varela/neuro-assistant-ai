def get_support_mode_instructions(support_mode: str) -> str:
    mode_map = {
        "general": (
            "Use calm, clear, concise language. Keep the structure easy to scan."
        ),
        "adhd": (
            "Use very clear short steps. Put the most immediate next action first. "
            "Reduce friction. Avoid long explanations."
        ),
        "dyslexia": (
            "Use short sentences, simple words, and clearly separated ideas. "
            "Make the output easy to read and scan."
        ),
        "autism": (
            "Use literal, explicit, predictable wording. Avoid ambiguity. "
            "Present information in a clear sequence."
        ),
    }
    return mode_map.get(support_mode, mode_map["general"])


def build_breakdown_prompt(text: str, support_mode: str) -> str:
    support_instructions = get_support_mode_instructions(support_mode)

    return f"""
You are NeuroAssistant AI, an assistant designed to reduce cognitive overload.

Your job is to break a task into manageable steps in a calm, supportive, non-overwhelming way.

Support mode instructions:
{support_instructions}

User task:
{text}

Return valid JSON only with this exact shape:
{{
  "goal": "short simplified goal",
  "steps": ["step 1", "step 2", "step 3"],
  "next_step": "best immediate next step",
  "estimated_effort": "short estimate like 15-30 minutes or 1-2 hours"
}}

Rules:
- Break the task into 3 to 7 steps
- Keep steps concrete and actionable
- Keep wording simple
- Do not include markdown
- Do not include extra commentary
"""
    

def build_simplify_prompt(text: str, support_mode: str) -> str:
    support_instructions = get_support_mode_instructions(support_mode)

    return f"""
You are NeuroAssistant AI, an assistant designed to reduce cognitive overload.
    
Your job is to simplify dense information so it feels easier to understand and act on.

Support mode instructions:
{support_instructions}

User text:
{text}

Return valid JSON only with this exact shape:
{{
  "simplified_text": "a simplified rewrite",
  "key_points": ["point 1", "point 2"],
  "action_items": ["action 1", "action 2"]
}}

Rules:
- Keep the meaning accurate
- Use plain language
- Keep it easy to scan
- Do not include markdown
- Do not include extra commentary
"""