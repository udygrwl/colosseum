import asyncio
from typing import AsyncGenerator
import json

from models import call_model, get_model_name
from prompts import ROUND_0_PROMPT, ROUND_1_PROMPT, ROUND_2_PROMPT, JUDGE_PROMPT


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def run_debate(
    topic: str,
    advocate_models: list[str],
    judge_model: str,
    use_thinking: bool = False,
) -> AsyncGenerator[str, None]:
    model_a, model_b, model_c = advocate_models

    def cm(model_id, prompt):
        return call_model(model_id, prompt, use_thinking=use_thinking)

    # ── Round 0: initial positions ──────────────────────────────────────────
    yield sse_event("status", {"round": 0, "message": "Round 0: Generating initial positions..."})

    round0_results = await asyncio.gather(
        cm(model_a, ROUND_0_PROMPT.format(topic=topic)),
        cm(model_b, ROUND_0_PROMPT.format(topic=topic)),
        cm(model_c, ROUND_0_PROMPT.format(topic=topic)),
    )

    positions = {model_a: round0_results[0], model_b: round0_results[1], model_c: round0_results[2]}

    yield sse_event("round0", {
        "round": 0,
        "results": [
            {"model": m, "model_name": get_model_name(m), "content": positions[m]}
            for m in advocate_models
        ]
    })

    # ── Round 1: each model critiques the other two ─────────────────────────
    yield sse_event("status", {"round": 1, "message": "Round 1: Cross-critiquing positions..."})

    def critique_prompt(other_a, other_b):
        return ROUND_1_PROMPT.format(
            topic=topic,
            model_a=get_model_name(other_a), position_a=positions[other_a],
            model_b=get_model_name(other_b), position_b=positions[other_b],
        )

    round1_results = await asyncio.gather(
        cm(model_a, critique_prompt(model_b, model_c)),
        cm(model_b, critique_prompt(model_a, model_c)),
        cm(model_c, critique_prompt(model_a, model_b)),
    )

    critiques = {model_a: round1_results[0], model_b: round1_results[1], model_c: round1_results[2]}

    yield sse_event("round1", {
        "round": 1,
        "results": [
            {
                "model": m,
                "model_name": get_model_name(m),
                "content": critiques[m],
                "critiqued": [get_model_name(o) for o in advocate_models if o != m],
            }
            for m in advocate_models
        ]
    })

    # ── Round 2: each model revises based on critiques it received ───────────
    yield sse_event("status", {"round": 2, "message": "Round 2: Revising positions..."})

    def revision_prompt(model, other_a, other_b):
        return ROUND_2_PROMPT.format(
            topic=topic,
            original_position=positions[model],
            critic_a=get_model_name(other_a), critique_a=critiques[other_a],
            critic_b=get_model_name(other_b), critique_b=critiques[other_b],
        )

    round2_results = await asyncio.gather(
        cm(model_a, revision_prompt(model_a, model_b, model_c)),
        cm(model_b, revision_prompt(model_b, model_a, model_c)),
        cm(model_c, revision_prompt(model_c, model_a, model_b)),
    )

    revisions = {model_a: round2_results[0], model_b: round2_results[1], model_c: round2_results[2]}

    yield sse_event("round2", {
        "round": 2,
        "results": [
            {"model": m, "model_name": get_model_name(m), "content": revisions[m]}
            for m in advocate_models
        ]
    })

    # ── Judge: synthesis verdict ─────────────────────────────────────────────
    yield sse_event("status", {"round": 3, "message": "Generating final verdict..."})

    def transcript_section(data: dict) -> str:
        parts = [f"[{get_model_name(m)}]:\n{data[m]}" for m in advocate_models]
        return "\n\n---\n\n".join(parts)

    judge_prompt = JUDGE_PROMPT.format(
        topic=topic,
        round_0_transcript=transcript_section(positions),
        round_1_transcript=transcript_section(critiques),
        round_2_transcript=transcript_section(revisions),
    )

    verdict = await call_model(judge_model, judge_prompt, use_thinking=use_thinking)

    yield sse_event("verdict", {
        "round": "verdict",
        "judge_model": judge_model,
        "judge_model_name": get_model_name(judge_model),
        "content": verdict,
    })

    yield sse_event("done", {"message": "Debate complete."})
