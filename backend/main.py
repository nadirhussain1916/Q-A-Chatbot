from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI
import uuid
import time

load_dotenv()

app = FastAPI(title="Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ===== Thread system =====

class Thread:
    def __init__(self, thread_id: str = None):
        self.thread_id = thread_id or str(uuid.uuid4())
        self.messages = []
        self.created_at = time.time()
        self.last_active = time.time()
    
    def add_message(self, role: str, content: str):
        message = {"role": role, "content": content, "timestamp": time.time()}
        self.messages.append(message)
        self.last_active = time.time()
        return message
    
    def get_messages(self):
        return [{"role": msg["role"], "content": msg["content"]} for msg in self.messages]
    
    def get_history(self):
        return [{"role": msg["role"], "content": msg["content"]} for msg in self.messages]

class ThreadManager:
    def __init__(self):
        self.threads = {}
        self.user_threads = {}
    
    def create_thread(self, user_id: str = None):
        thread = Thread()
        self.threads[thread.thread_id] = thread
        if user_id:
            self.user_threads[user_id] = thread.thread_id
        return thread
    
    def get_thread(self, thread_id: str):
        return self.threads.get(thread_id)
    
    def get_or_create_user_thread(self, user_id: str):
        if user_id in self.user_threads:
            thread_id = self.user_threads[user_id]
            thread = self.threads.get(thread_id)
            if thread:
                return thread
        return self.create_thread(user_id)
    
    def cleanup_old_threads(self, max_age_hours=24):
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        threads_to_remove = [tid for tid, t in self.threads.items() if current_time - t.last_active > max_age_seconds]
        for tid in threads_to_remove:
            self.threads.pop(tid, None)
            self.user_threads = {uid: t_id for uid, t_id in self.user_threads.items() if t_id != tid}

thread_manager = ThreadManager()

# ===== Models =====

class ChatRequest(BaseModel):
    user_id: str
    message: str
    thread_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    history: List[Dict[str, str]]
    thread_id: str

# ===== Routes =====

@app.post("/chatbot", response_model=ChatResponse)
async def chat_with_bot(chat_request: ChatRequest = Body(...)):
    user_id = chat_request.user_id
    user_message = chat_request.message
    thread_id = chat_request.thread_id

    if not user_message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Always use the client-provided thread_id if it exists
        if thread_id:
            thread = thread_manager.get_thread(thread_id)
            if not thread:
                # If the thread_id doesn't exist server-side, create it
                thread = thread_manager.create_thread(user_id)
                thread.thread_id = thread_id  # Use the client's thread_id
        else:
            # If no thread_id provided, create a new thread
            thread = thread_manager.create_thread(user_id)

        thread.add_message("user", user_message)

        messages = thread.get_messages()

        response = openai_client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4"),
            messages=messages,
            temperature=0.7,
        )

        assistant_message = response.choices[0].message.content
        thread.add_message("assistant", assistant_message)

        thread_manager.cleanup_old_threads()

        return {
            "response": assistant_message,
            "history": thread.get_history(),
            "thread_id": thread.thread_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the Chatbot API. Use /chatbot endpoint to interact."}
