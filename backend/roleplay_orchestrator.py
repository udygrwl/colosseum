import asyncio
import json
from typing import AsyncGenerator, List, Optional

from models import call_model, get_model_name
from roleplay_prompts import ROLEPLAY_TURN_PROMPT


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def run_roleplay(
    actors: list,           # list of {model_id, role}
    scenario: str,
    max_turns: Optional[int] = 20,
) -> AsyncGenerator[str, None]:
    history = []  # [{role, model_name, content}]
    n = len(actors)
    limit = max_turns if max_turns and max_turns > 0 else 200

    for turn_idx in range(limit):
        actor = actors[turn_idx % n]
        model_id = actor.model_id
        role = actor.role

        # Build history block
        if history:
            lines = "\n\n".join(f"{h['role']}: {h['content']}" for h in history)
            history_block = f"CONVERSATION SO FAR:\n{lines}"
        else:
            history_block = "You open the scene."

        prompt = ROLEPLAY_TURN_PROMPT.format(
            scenario=scenario,
            role=role,
            history_block=history_block,
        )

        try:
            raw = await call_model(model_id, prompt, max_tokens=400)
        except Exception as e:
            yield sse_event("error", {"message": f"Error from {get_model_name(model_id)}: {str(e)}"})
            yield sse_event("done", {"reason": "error", "total_turns": turn_idx})
            return

        # Detect /end signal (case-insensitive, may have punctuation around it)
        import re
        ended = bool(re.search(r'/end', raw, re.IGNORECASE))
        content = re.sub(r'\s*/end\s*\.?$', '', raw, flags=re.IGNORECASE).strip()

        history.append({"role": role, "model_name": get_model_name(model_id), "content": content})

        yield sse_event("turn", {
            "turn_index": turn_idx,
            "model_id": model_id,
            "model_name": get_model_name(model_id),
            "role": role,
            "content": content,
        })

        if ended:
            yield sse_event("done", {"reason": "ended", "total_turns": turn_idx + 1})
            return

    yield sse_event("done", {"reason": "max_turns", "total_turns": limit})
