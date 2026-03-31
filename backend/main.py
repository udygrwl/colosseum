import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json

from models import get_available_models, call_model
from roleplay import run_roleplay
from prompts import ANALYST_SYSTEM

app = FastAPI(title="Colosseum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/models")
def list_models():
    return {"models": get_available_models()}


class Character(BaseModel):
    model: str
    role_description: str
    character_name: str


class RoleplayRequest(BaseModel):
    scenario: str
    characters: list[Character]
    max_turns: Optional[int] = None


@app.post("/api/roleplay")
async def start_roleplay(req: RoleplayRequest):
    chars = [c.dict() for c in req.characters]

    async def event_stream():
        async for chunk in run_roleplay(req.scenario, chars, req.max_turns):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    message: str
    conversation_history: list[ChatMessage] = []
    roleplay_transcript: Optional[str] = None


@app.post("/api/chat")
async def chat(req: ChatRequest):
    system = ANALYST_SYSTEM
    if req.roleplay_transcript:
        system += f"\n\n## Current Roleplay Transcript\n\n{req.roleplay_transcript}"

    messages = [{"role": m.role, "content": m.content} for m in req.conversation_history]
    messages.append({"role": "user", "content": req.message})

    response = await call_model(req.model, system, messages)
    return {"response": response}
