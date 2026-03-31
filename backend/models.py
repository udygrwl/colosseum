import os
from typing import Optional

# thinking=True  -> supports extended thinking (Anthropic beta / Google ThinkingConfig)
# reasoning=True -> always reasons internally (OpenAI o-series), no toggle needed
AVAILABLE_MODELS = [
    # -- Anthropic ----------------------------------------------------------------
    {"id": "claude-opus-4-6",             "name": "Claude Opus 4.6",             "provider": "anthropic", "tier": 1, "thinking": True,  "reasoning": False},
    {"id": "claude-sonnet-4-6",           "name": "Claude Sonnet 4.6",           "provider": "anthropic", "tier": 2, "thinking": True,  "reasoning": False},
    {"id": "claude-3-7-sonnet-20250219",  "name": "Claude 3.7 Sonnet",           "provider": "anthropic", "tier": 2, "thinking": True,  "reasoning": False},
    {"id": "claude-haiku-4-5-20251001",   "name": "Claude Haiku 4.5",            "provider": "anthropic", "tier": 3, "thinking": False, "reasoning": False},
    {"id": "claude-3-5-sonnet-20241022",  "name": "Claude 3.5 Sonnet",           "provider": "anthropic", "tier": 2, "thinking": False, "reasoning": False},
    # -- Google -------------------------------------------------------------------
    {"id": "gemini-3-pro-preview",        "name": "Gemini 3 Pro (Preview)",      "provider": "google",    "tier": 1, "thinking": False, "reasoning": False},
    {"id": "gemini-2.5-pro",              "name": "Gemini 2.5 Pro",              "provider": "google",    "tier": 1, "thinking": True,  "reasoning": False},
    {"id": "gemini-2.5-flash",            "name": "Gemini 2.5 Flash",            "provider": "google",    "tier": 2, "thinking": True,  "reasoning": False},
    {"id": "gemini-2.5-flash-lite",       "name": "Gemini 2.5 Flash Lite",       "provider": "google",    "tier": 3, "thinking": False, "reasoning": False},
    # -- OpenAI -- GPT-5.4 (latest) -----------------------------------------------
    {"id": "gpt-5.4",                     "name": "GPT-5.4",                     "provider": "openai",    "tier": 1, "thinking": False, "reasoning": False},
    {"id": "gpt-5.4-mini",                "name": "GPT-5.4 Mini",                "provider": "openai",    "tier": 2, "thinking": False, "reasoning": False},
    {"id": "gpt-5.4-nano",                "name": "GPT-5.4 Nano",                "provider": "openai",    "tier": 3, "thinking": False, "reasoning": False},
    # -- OpenAI -- GPT-5.3 / 5.2 / 5.1 / 5.0 ------------------------------------
    {"id": "gpt-5.3-chat-latest",         "name": "GPT-5.3",                     "provider": "openai",    "tier": 1, "thinking": False, "reasoning": False},
    {"id": "gpt-5.2",                     "name": "GPT-5.2",                     "provider": "openai",    "tier": 1, "thinking": False, "reasoning": False},
    {"id": "gpt-5.1",                     "name": "GPT-5.1",                     "provider": "openai",    "tier": 2, "thinking": False, "reasoning": False},
    {"id": "gpt-5",                       "name": "GPT-5",                       "provider": "openai",    "tier": 1, "thinking": False, "reasoning": False},
    {"id": "gpt-5-mini",                  "name": "GPT-5 Mini",                  "provider": "openai",    "tier": 2, "thinking": False, "reasoning": False},
    # -- OpenAI -- GPT-4 series ---------------------------------------------------
    {"id": "gpt-4.1",                     "name": "GPT-4.1",                     "provider": "openai",    "tier": 2, "thinking": False, "reasoning": False},
    {"id": "gpt-4.1-mini",                "name": "GPT-4.1 Mini",               "provider": "openai",    "tier": 3, "thinking": False, "reasoning": False},
    {"id": "gpt-4.1-nano",                "name": "GPT-4.1 Nano",               "provider": "openai",    "tier": 3, "thinking": False, "reasoning": False},
    {"id": "gpt-4o",                      "name": "GPT-4o",                      "provider": "openai",    "tier": 2, "thinking": False, "reasoning": False},
    {"id": "gpt-4o-mini",                 "name": "GPT-4o Mini",                 "provider": "openai",    "tier": 3, "thinking": False, "reasoning": False},
    # -- OpenAI -- o-series -------------------------------------------------------
    {"id": "o4-mini",                     "name": "O4 Mini",                     "provider": "openai",    "tier": 2, "thinking": False, "reasoning": True},
    {"id": "o3",                          "name": "O3",                          "provider": "openai",    "tier": 1, "thinking": False, "reasoning": True},
    {"id": "o3-mini",                     "name": "O3 Mini",                     "provider": "openai",    "tier": 2, "thinking": False, "reasoning": True},
    {"id": "o1-pro",                      "name": "O1 Pro",                      "provider": "openai",    "tier": 1, "thinking": False, "reasoning": True},
    {"id": "o1",                          "name": "O1",                          "provider": "openai",    "tier": 1, "thinking": False, "reasoning": True},
    {"id": "o1-mini",                     "name": "O1 Mini",                     "provider": "openai",    "tier": 3, "thinking": False, "reasoning": True},
]

OPENAI_REASONING_MODELS = {"o1", "o1-mini", "o1-pro", "o3", "o3-mini", "o4-mini"}


def openai_uses_completion_tokens(model_id: str) -> bool:
    return model_id in OPENAI_REASONING_MODELS or model_id.startswith("gpt-5")


def _anthropic_key() -> str:
    return (os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHOPIC_KEY") or "").strip()

def _google_key() -> str:
    return (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()

def _openai_key() -> str:
    return (os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY") or "").strip()


def get_available_models():
    available = []
    for model in AVAILABLE_MODELS:
        key_ok = (
            (model["provider"] == "anthropic" and _anthropic_key()) or
            (model["provider"] == "google"    and _google_key()) or
            (model["provider"] == "openai"    and _openai_key())
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
    max_tokens: Optional[int] = None,
) -> str:
    provider = get_provider(model_id)
    if provider == "anthropic":
        return await _call_anthropic(model_id, prompt, max_tokens)
    elif provider == "google":
        return await _call_google(model_id, prompt, max_tokens)
    elif provider == "openai":
        return await _call_openai(model_id, prompt, max_tokens)
    else:
        raise ValueError(f"Unknown model: {model_id}")


async def _call_anthropic(model_id: str, prompt: str, max_tokens: Optional[int]) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=_anthropic_key())

    if model_supports_thinking(model_id):
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


async def _call_google(model_id: str, prompt: str, max_tokens: Optional[int]) -> str:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=_google_key())

    effective_tokens = max_tokens or 4096
    config = types.GenerateContentConfig(max_output_tokens=effective_tokens)

    response = await client.aio.models.generate_content(
        model=model_id, contents=prompt, config=config,
    )
    return response.text


async def _call_openai(model_id: str, prompt: str, max_tokens: Optional[int]) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=_openai_key())
    use_completion_tokens = openai_uses_completion_tokens(model_id)

    kwargs = dict(model=model_id, messages=[{"role": "user", "content": prompt}])
    effective_tokens = max_tokens or (8192 if use_completion_tokens else 4096)
    if use_completion_tokens:
        kwargs["max_completion_tokens"] = effective_tokens
    else:
        kwargs["max_tokens"] = effective_tokens

    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content
