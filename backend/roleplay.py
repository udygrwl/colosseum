import asyncio
import json
from typing import AsyncGenerator, Optional
from models import call_model
from prompts import ROLEPLAY_SYSTEM_TEMPLATE


async def run_roleplay(
    scenario: str,
    characters: list,  # [{model, role_description, character_name}]
    max_turns: Optional[int]
) -> AsyncGenerator[str, None]:
    """
    Orchestrates the roleplay, yielding SSE-formatted strings.
    Each character takes turns responding to the conversation so far.
    """
    num_chars = len(characters)
    # Build system prompts per character
    system_prompts = []
    for i, char in enumerate(characters):
        system_prompts.append(
            ROLEPLAY_SYSTEM_TEMPLATE.format(
                character_name=char.get("character_name", f"Character {i+1}"),
                scenario=scenario,
                role_description=char["role_description"]
            )
        )

    # conversation_history is from perspective of each model separately
    # We maintain a shared flat log for context
    shared_log = []  # [{role, content, character, model}]

    turn = 0
    current_char_idx = 0
    end_votes = set()  # char indices that have signalled /end

    while True:
        if max_turns is not None and turn >= max_turns:
            yield _sse({"type": "ended", "reason": "max_turns"})
            return

        char = characters[current_char_idx]
        system = system_prompts[current_char_idx]

        # Build messages for this model: all prior turns as user/assistant
        # This model sees itself as "assistant" and others as "user"
        messages = _build_messages_for_char(shared_log, current_char_idx, num_chars)

        # Add a user prompt to kick off if it's the first turn
        if not messages:
            messages = [{"role": "user", "content": f"The scenario begins. You go first. Scenario: {scenario}"}]

        try:
            response_text = await call_model(char["model"], system, messages)
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})
            return

        # Clean up response
        response_text = response_text.strip()

        # Check for /end vote
        has_end = "/end" in response_text.lower()
        clean_text = response_text.replace("/end", "").strip()

        if has_end:
            end_votes.add(current_char_idx)

        shared_log.append({
            "role": "assistant",
            "content": clean_text,
            "character": char.get("character_name", f"Character {current_char_idx+1}"),
            "model": char["model"],
            "char_idx": current_char_idx
        })

        yield _sse({
            "type": "turn",
            "round": turn + 1,
            "model": char["model"],
            "character": char.get("character_name", f"Character {current_char_idx+1}"),
            "content": clean_text,
            "end_vote": has_end,
        })

        # End only when all characters have voted /end
        if len(end_votes) == num_chars:
            yield _sse({"type": "ended", "reason": "unanimous"})
            return

        turn += 1
        current_char_idx = (current_char_idx + 1) % num_chars

        # Small delay to avoid hammering APIs
        await asyncio.sleep(0.1)


def _build_messages_for_char(shared_log: list, char_idx: int, num_chars: int) -> list:
    """
    Build the message history from the perspective of the given character.
    That character's turns = assistant, all others = user (combined into one message per turn).
    """
    if not shared_log:
        return []

    messages = []
    current_role = None
    current_content_parts = []

    for entry in shared_log:
        is_self = entry["char_idx"] == char_idx
        role = "assistant" if is_self else "user"

        if role != current_role:
            if current_role is not None:
                messages.append({
                    "role": current_role,
                    "content": "\n".join(current_content_parts)
                })
            current_role = role
            current_content_parts = []

        prefix = "" if is_self else f"[{entry['character']}]: "
        current_content_parts.append(f"{prefix}{entry['content']}")

    if current_role is not None:
        messages.append({
            "role": current_role,
            "content": "\n".join(current_content_parts)
        })

    # OpenAI/Anthropic require starting with user message
    if messages and messages[0]["role"] == "assistant":
        messages.insert(0, {"role": "user", "content": f"[Scene begins]"})

    # Ensure last message is user (so the model responds as assistant)
    if messages and messages[-1]["role"] == "assistant":
        messages.append({"role": "user", "content": "[Continue the scene]"})

    return messages


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
