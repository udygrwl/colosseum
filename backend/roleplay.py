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
    Uses call_model(model_id, prompt, max_tokens) with a single combined prompt.
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

    shared_log = []  # [{content, character, model, char_idx}]

    turn = 0
    current_char_idx = 0
    end_votes = set()

    while True:
        if max_turns is not None and turn >= max_turns:
            yield _sse({"type": "ended", "reason": "max_turns"})
            return

        char = characters[current_char_idx]
        system = system_prompts[current_char_idx]

        # Build a single prompt string combining system prompt + conversation history
        prompt_parts = [system, ""]

        if not shared_log:
            prompt_parts.append(f"The scenario begins. You go first. Scenario: {scenario}")
        else:
            prompt_parts.append("Conversation so far:")
            for entry in shared_log:
                is_self = entry["char_idx"] == current_char_idx
                label = "You" if is_self else entry["character"]
                prompt_parts.append(f"[{label}]: {entry['content']}")
            prompt_parts.append("")
            prompt_parts.append("Now respond in character. Stay brief and snappy:")

        prompt = "\n".join(prompt_parts)

        try:
            response_text = await call_model(char["model"], prompt, max_tokens=300)
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})
            return

        response_text = response_text.strip()

        # Check for /end vote
        has_end = "/end" in response_text.lower()
        clean_text = response_text.replace("/end", "").strip()

        if has_end:
            end_votes.add(current_char_idx)

        shared_log.append({
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

        if len(end_votes) == num_chars:
            yield _sse({"type": "ended", "reason": "unanimous"})
            return

        turn += 1
        current_char_idx = (current_char_idx + 1) % num_chars

        await asyncio.sleep(0.1)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
