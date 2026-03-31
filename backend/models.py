import os

ANTHROPIC_MODELS = [
    {"id": "claude-opus-4-6",            "provider": "anthropic", "label": "Claude Opus 4.6"},
    {"id": "claude-sonnet-4-6",          "provider": "anthropic", "label": "Claude Sonnet 4.6"},
    {"id": "claude-sonnet-4-20250514",   "provider": "anthropic", "label": "Claude Sonnet 4"},
    {"id": "claude-haiku-4-5-20251001",  "provider": "anthropic", "label": "Claude Haiku 4.5"},
    {"id": "claude-3-7-sonnet-20250219", "provider": "anthropic", "label": "Claude 3.7 Sonnet"},
    {"id": "claude-3-5-sonnet-20241022", "provider": "anthropic", "label": "Claude 3.5 Sonnet"},
    {"id": "claude-3-5-haiku-20241022",  "provider": "anthropic", "label": "Claude 3.5 Haiku"},
    {"id": "claude-3-opus-20240229",     "provider": "anthropic", "label": "Claude 3 Opus"},
    {"id": "claude-3-haiku-20240307",    "provider": "anthropic", "label": "Claude 3 Haiku"},
]

GOOGLE_MODELS = [
    {"id": "gemini-2.5-pro",       "provider": "google", "label": "Gemini 2.5 Pro"},
    {"id": "gemini-2.5-flash",     "provider": "google", "label": "Gemini 2.5 Flash"},
    {"id": "gemini-2.0-flash",     "provider": "google", "label": "Gemini 2.0 Flash"},
    {"id": "gemini-2.0-flash-lite","provider": "google", "label": "Gemini 2.0 Flash Lite"},
    {"id": "gemini-1.5-pro",       "provider": "google", "label": "Gemini 1.5 Pro"},
    {"id": "gemini-1.5-flash",     "provider": "google", "label": "Gemini 1.5 Flash"},
    {"id": "gemini-1.5-flash-8b",  "provider": "google", "label": "Gemini 1.5 Flash 8B"},
]

OPENAI_MODELS = [
    {"id": "gpt-4o",       "provider": "openai", "label": "GPT-4o"},
    {"id": "gpt-4o-mini",  "provider": "openai", "label": "GPT-4o Mini"},
    {"id": "o4-mini",      "provider": "openai", "label": "o4-mini"},
    {"id": "o3",           "provider": "openai", "label": "o3"},
    {"id": "o3-mini",      "provider": "openai", "label": "o3-mini"},
    {"id": "o1",           "provider": "openai", "label": "o1"},
    {"id": "o1-mini",      "provider": "openai", "label": "o1-mini"},
    {"id": "gpt-4-turbo",  "provider": "openai", "label": "GPT-4 Turbo"},
    {"id": "gpt-3.5-turbo","provider": "openai", "label": "GPT-3.5 Turbo"},
]

def get_available_models():
    models = []
    if os.getenv("ANTHROPIC_API_KEY"):
        models.extend(ANTHROPIC_MODELS)
    if os.getenv("GOOGLE_API_KEY"):
        models.extend(GOOGLE_MODELS)
    if os.getenv("OPENAI_API_KEY"):
        models.extend(OPENAI_MODELS)
    return models


async def call_model(model_id: str, system_prompt: str, messages: list) -> str:
    """Call the appropriate LLM provider and return the text response."""
    provider = _get_provider(model_id)

    if provider == "anthropic":
        return await _call_anthropic(model_id, system_prompt, messages)
    elif provider == "google":
        return await _call_google(model_id, system_prompt, messages)
    elif provider == "openai":
        return await _call_openai(model_id, system_prompt, messages)
    else:
        raise ValueError(f"Unknown model: {model_id}")


def _get_provider(model_id: str) -> str:
    if "claude" in model_id:
        return "anthropic"
    elif "gemini" in model_id:
        return "google"
    elif model_id.startswith(("gpt-", "o1", "o3", "o4")):
        return "openai"
    raise ValueError(f"Cannot determine provider for model: {model_id}")


async def _call_anthropic(model_id: str, system_prompt: str, messages: list) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = await client.messages.create(
        model=model_id,
        max_tokens=300,
        system=system_prompt,
        messages=messages
    )
    return response.content[0].text


async def _call_google(model_id: str, system_prompt: str, messages: list) -> str:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

    # Convert messages to Google format
    history = []
    for msg in messages[:-1]:  # all but last
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})

    model = genai.GenerativeModel(
        model_name=model_id,
        system_instruction=system_prompt
    )
    chat = model.start_chat(history=history)
    response = await chat.send_message_async(messages[-1]["content"])
    return response.text


async def _call_openai(model_id: str, system_prompt: str, messages: list) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # o1-mini doesn't support system messages — prepend as user context instead
    if model_id == "o1-mini":
        first_user = messages[0]["content"] if messages else ""
        patched = [{"role": "user", "content": f"[Context: {system_prompt}]\n\n{first_user}"}]
        patched += messages[1:]
        full_messages = patched
    else:
        full_messages = [{"role": "system", "content": system_prompt}] + messages

    response = await client.chat.completions.create(
        model=model_id,
        messages=full_messages,
        max_tokens=300
    )
    return response.choices[0].message.content
