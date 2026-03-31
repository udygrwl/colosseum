import os
from pathlib import Path
from typing import Optional, List
from dotenv import load_dotenv

# Load .env when running locally (not present in Railway — use env vars there)
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel

from models import get_available_models, call_model
from orchestrator import run_debate
from roleplay_orchestrator import run_roleplay
from roleplay_prompts import CHAT_SYSTEM_PROMPT

app = FastAPI(title="Athena API")

# Raw CORS middleware — echoes back the exact Origin header so Railway's
# Fastly CDN doesn't strip it (Fastly drops `Access-Control-Allow-Origin: *`
# but passes through specific origin values).
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")

    # Handle OPTIONS preflight
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin or "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "86400",
            },
        )

    response = await call_next(request)
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Vary"] = "Origin"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    return response


# ── Debate ───────────────────────────────────────────────────────────────────

class DebateRequest(BaseModel):
    topic: str
    advocate_models: List[str]
    judge_model: str
    use_thinking: bool = False


@app.get("/api/models")
def list_models():
    return {"models": get_available_models()}


@app.get("/api/health")
def health():
    from models import _anthropic_key, _google_key, _openai_key
    def key_info(k): return {"set": bool(k), "length": len(k), "prefix": k[:8] if k else "", "suffix": k[-6:] if k else ""}
    return {
        "anthropic": key_info(_anthropic_key()),
        "google":    key_info(_google_key()),
        "openai":    key_info(_openai_key()),
    }


@app.post("/api/debate")
async def debate(req: DebateRequest):
    if len(req.advocate_models) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 advocate models required.")
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    available_ids = {m["id"] for m in get_available_models()}
    for m in req.advocate_models + [req.judge_model]:
        if m not in available_ids:
            raise HTTPException(status_code=400, detail=f"Model not available: {m}")

    async def event_stream():
        async for chunk in run_debate(req.topic, req.advocate_models, req.judge_model, req.use_thinking):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Roleplay ─────────────────────────────────────────────────────────────────

class RoleplayActor(BaseModel):
    model_id: str
    role: str


class RoleplayRequest(BaseModel):
    actors: List[RoleplayActor]
    scenario: str
    max_turns: Optional[int] = 20


@app.post("/api/roleplay")
async def roleplay(req: RoleplayRequest):
    if not (2 <= len(req.actors) <= 3):
        raise HTTPException(status_code=400, detail="2 or 3 actors required.")
    if not req.scenario.strip():
        raise HTTPException(status_code=400, detail="Scenario cannot be empty.")

    available_ids = {m["id"] for m in get_available_models()}
    for a in req.actors:
        if a.model_id not in available_ids:
            raise HTTPException(status_code=400, detail=f"Model not available: {a.model_id}")

    async def event_stream():
        async for chunk in run_roleplay(req.actors, req.scenario, req.max_turns):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Analysis Chat ─────────────────────────────────────────────────────────────

class ChatHistoryMessage(BaseModel):
    role: str    # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    model_id: str
    message: str
    history: List[ChatHistoryMessage] = []
    context: str = ""


@app.post("/api/chat")
async def chat(req: ChatRequest):
    available_ids = {m["id"] for m in get_available_models()}
    if req.model_id not in available_ids:
        raise HTTPException(status_code=400, detail=f"Model not available: {req.model_id}")

    # Build prompt: system + optional transcript context + conversation history + new message
    parts = [CHAT_SYSTEM_PROMPT]
    if req.context.strip():
        parts.append(f"\n=== ROLEPLAY TRANSCRIPTS ===\n{req.context}\n=== END TRANSCRIPTS ===")
    if req.history:
        history_lines = []
        for msg in req.history:
            label = "User" if msg.role == "user" else "Assistant"
            history_lines.append(f"{label}: {msg.content}")
        parts.append("\n" + "\n\n".join(history_lines))
    parts.append(f"\nUser: {req.message}\nAssistant:")

    prompt = "\n".join(parts)
    content = await call_model(req.model_id, prompt, max_tokens=2048)
    return {"content": content}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
