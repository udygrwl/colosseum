import os
from typing import Optional

# thinking=True  → supports extended thinking (Anthropic beta / Google ThinkingConfig)
# reasoning=True → always reasons internally (OpenAI o-series), no toggle needed
AVAILABLE_MODELS = [
    # ── Anthropic ────────────────────────────────────────────────────────────
    {"id": "claude-opus-4-6",             "name": "Claude Opus 4.6",             "provider": "anthropic", "thinking": True,  "reasoning": False},
    {"id": "claude-sonnet-4-6",           "name": "Claude Sonnet 4.6",           "provider": "anthropic", "thinking": True,  "reasoning": False},
    {"id": "claude-3-7-sonnet-20250219",  "name": "Claude 3.7 Sonnet",           "provider": "anthropic", "thinking": True,  "reasoning": False},
    {"id": "claude-haiku-4-5-20251001",   "name": "Claude Haiku 4.5",            "provider": "anthropic", "thinking": False, "reasoning": False},
    {"id": "claude-3-5-sonnet-20241022",  "name": "Claude 3.5 Sonnet",           "provider": "anthropic", "thinking": False, "reasoning": False},
    {"id": "claude-3-5-haiku-20241022",   "name": "Claude 3.5 Haiku",            "provider": "anthropic", "thinking": False, "reasoning": False},
    # ── Google ───────────────────────────────────────────────────────────────
    {"id": "gemini-2.5-pro",              "name": "Gemini 2.5 Pro",              "provider": "google",    "thinking": True,  "reasoning": False},
    {"id": "gemini-2.5-flash",            "name": "Gemini 2.5 Flash",            "provider": "google",    "thinking": True,  "reasoning": False},
    {"id": "gemini-2.0-flash",            "name": "Gemini 2.0 Flash",            "provider": "google",    "thinking": False, "reasoning": False},
    {"id": "gemini-1.5-pro",              "name": "Gemini 1.5 Pro",              "provider": "google",    "thinking": False, "reasoning": False},
    # ── OpenAI ───────────────────────────────────────────────────────────────
    {"id": "o3",                          "name": "O3",                          "provider": "openai",    "thinking": False, "reasoning": True},
    {"id": "o3-mini",                     "name": "O3 Mini",                     "provider": "openai",    "thinking": False, "reasoning": True},
    {"id": "o1",                          "name": "O1",                          "provider": "openai",    "thinking": False, "reasoning": True},
    {"id": "gpt-4o",                      "name": "GPT-4o",                      "provider": "openai",    "thinking": False, "reasoning": False},
    {"id": "gpt-4o-mini",                 "name": "GPT-4o Mini",                 "provider": "openai",    "thinking": False, "reasoning": False},
]

OPENAI_REASONING_MODELS = {"o1", "o3", "o3-mini", "o4-mini", "o1-mini"}


def get_available_models():
    available = []
    for model in AVAILABLE_MODELS:
        key_ok = (
            (model["provider"] == "anthropic" and os.getenv("ANTHROPIC_API_KEY")) or
            (model["provider"] == "google"    and (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))) or
            (model["provider"] == "openai"    and os.getenv("OPENAI_API_KEY"))
        )
        if key_ok:
            available.append(model)
    return available


def get_provider(model_id: str) -> Optional[str]:
    for m in AVAILABLE_MODELS:
        if m["id"] == model_id:
            return m["provider"]
    return None


def get_model_name(model_id: str) -> str:
    for m in AVAILABLE_MODELS:
        if m["id"] == model_id:
            return m["name"]
    return model_id


def model_supports_thinking(model_id: str) -> bool:
    for m in AVAILABLE_MODELS:
        if m["id"] == model_id:
            return m.get("thinking", False)
    return False


async def call_model(
    model_id: str,
    prompt: str,
    use_thinking: bool = False,
    max_tokens: Optional[int] = None,
) -> str:
    provider = get_provider(model_id)
    if provider == "anthropic":
        return await call_anthropic(model_id, prompt, use_thinking, max_tokens)
    elif provider == "google":
        return await call_google(model_id, prompt, use_thinking, max_tokens)
    elif provider == "openai":
        return await call_openai(model_id, prompt, max_tokens)
    else:
        raise ValueError(f"Unknown model: {model_id}")


async def call_anthropic(model_id: str, prompt: str, use_thinking: bool, max_tokens: Optional[int]) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    if use_thinking and model_supports_thinking(model_id):
        effective_tokens = max_tokens or 16000
        message = await client.messages.create(
            model=model_id,
            max_tokens=effective_tokens,
            messages=[{"role": "user", "content": prompt}],
            extra_body={"thinking": {"type": "enabled", "budget_tokens": min(10000, effective_tokens - 1000)}},
        )
        texts = [b.text for b in message.content if hasattr(b, "text") and b.type == "text"]
        return "\n\n".join(texts) if texts else message.content[-1].text
    else:
        message = await client.messages.create(
            model=model_id,
            max_tokens=max_tokens or 4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text


async def call_google(model_id: str, prompt: str, use_thinking: bool, max_tokens: Optional[int]) -> str:
    from google import genai
    from google.genai import types
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    effective_tokens = max_tokens or (8192 if use_thinking else 4096)

    if use_thinking and model_supports_thinking(model_id):
        config = types.GenerateContentConfig(
            max_output_tokens=effective_tokens,
            thinking_config=types.ThinkingConfig(include_thoughts=True),
        )
    else:
        config = types.GenerateContentConfig(max_output_tokens=effective_tokens)

    response = await client.aio.models.generate_content(
        model=model_id, contents=prompt, config=config,
    )
    if use_thinking and model_supports_thinking(model_id):
        parts = response.candidates[0].content.parts
        text_parts = [p.text for p in parts if not getattr(p, "thought", False) and hasattr(p, "text")]
        return "\n\n".join(text_parts) if text_parts else response.text
    return response.text


async def call_openai(model_id: str, prompt: str, max_tokens: Optional[int]) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    is_reasoning = model_id in OPENAI_REASONING_MODELS

    kwargs = dict(model=model_id, messages=[{"role": "user", "content": prompt}])
    effective_tokens = max_tokens or (8192 if is_reasoning else 4096)
    if is_reasoning:
        kwargs["max_completion_tokens"] = effective_tokens
    else:
        kwargs["max_tokens"] = effective_tokens

    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content
