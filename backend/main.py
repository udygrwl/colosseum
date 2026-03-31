import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel

from models import get_available_models, call_model, _anthropic_key, _google_key, _openai_key
from prompts import OVERSEER_ARENA_SYSTEM, OVERSEER_ROLEPLAY_SYSTEM
from roleplay import run_roleplay

app = FastAPI(title="Colosseum API")


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
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


# -- Models / Health -----------------------------------------------------------

@app.get("/api/models")
def list_models():
    return {"models": get_available_models()}


@app.get("/api/health")
def health():
    def key_info(k):
        return {"set": bool(k), "length": len(k), "prefix": k[:8] if k else "", "suffix": k[-6:] if k else ""}
    return {
        "anthropic": key_info(_anthropic_key()),
        "google":    key_info(_google_key()),
        "openai":    key_info(_openai_key()),
    }


# -- Arena: single prompt to one model ----------------------------------------

class PromptRequest(BaseModel):
    model_id: str
    prompt: str


@app.post("/api/prompt")
async def prompt(req: PromptRequest):
    available_ids = {m["id"] for m in get_available_models()}
    if req.model_id not in available_ids:
        raise HTTPException(status_code=400, detail=f"Model not available: {req.model_id}")
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    try:
        content = await call_model(req.model_id, req.prompt)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Overseer chat -------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str


class OverseerChatRequest(BaseModel):
    model_id: str
    message: str
    history: List[ChatMessage] = []
    context: str = ""


@app.post("/api/overseer/chat")
async def overseer_chat(req: OverseerChatRequest):
    available_ids = {m["id"] for m in get_available_models()}
    if req.model_id not in available_ids:
        raise HTTPException(status_code=400, detail=f"Model not available: {req.model_id}")

    # Determine which system prompt to use based on context content
    if "Arena Responses" in req.context:
        system = OVERSEER_ARENA_SYSTEM.format(context=req.context)
    else:
        system = OVERSEER_ROLEPLAY_SYSTEM.format(context=req.context)

    parts = [system, ""]
    for msg in req.history:
        label = "User" if msg.role == "user" else "Overseer"
        parts.append(f"{label}: {msg.content}")
    parts.append(f"User: {req.message}")
    parts.append("Overseer:")
    prompt_text = "\n\n".join(parts)

    try:
        content = await call_model(req.model_id, prompt_text, max_tokens=4096)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Roleplay SSE stream ------------------------------------------------------

class RoleplayRequest(BaseModel):
    scenario: str
    characters: list
    max_turns: Optional[int] = None


@app.post("/api/roleplay")
async def roleplay(req: RoleplayRequest):
    if not req.scenario.strip():
        raise HTTPException(status_code=400, detail="Scenario cannot be empty.")
    if len(req.characters) < 2:
        raise HTTPException(status_code=400, detail="At least 2 characters required.")

    async def event_stream():
        async for chunk in run_roleplay(req.scenario, req.characters, req.max_turns):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
