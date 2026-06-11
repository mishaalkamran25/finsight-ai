from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import os
from routers.upload import SESSION

router = APIRouter()

SYSTEM_PROMPT = """You are a senior FP&A analyst with 10+ years of experience at Fortune 500 consumer goods companies. 
You have been given structured financial data from the user's uploaded file.

Your job is to answer finance questions with the precision and tone of a seasoned analyst presenting to a CFO. 

Rules you must follow:
1. ONLY use numbers and facts present in the FINANCIAL DATA provided. Never invent or estimate figures.
2. If the data does not contain enough information to answer the question, say so clearly and explain what data would be needed.
3. Always cite specific line items, dollar amounts, and percentages when relevant.
4. Structure answers with a clear conclusion first, then supporting detail (Pyramid Principle).
5. Use FP&A language: variance, favorable/unfavorable, bps (basis points), YoY, MoM, budget vs actuals, run rate, headwinds/tailwinds.
6. Keep responses concise but complete. 3–6 sentences is ideal for most answers.
7. If asked to summarize for a CFO or executive, lead with the one-line headline, then 2–3 key drivers.
8. Never hallucinate trends, forecasts, or benchmarks not present in the data.
"""

class ChatMessage(BaseModel):
    role: str
    content: str

class CopilotRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/copilot")
async def copilot(req: CopilotRequest):
    if not SESSION.get("context"):
        raise HTTPException(status_code=400, detail="No file loaded. Please upload a file or load demo data first.")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured.")

    client = anthropic.Anthropic(api_key=api_key)

    financial_context = f"\n\nFINANCIAL DATA:\n{SESSION['context']}\n\nFile: {SESSION.get('filename', 'Uploaded file')}"

    messages = []
    for msg in (req.history or []):
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({
        "role": "user",
        "content": req.message
    })

    try:
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT + financial_context,
            messages=messages,
        )
        answer = response.content[0].text
        return JSONResponse({"response": answer, "status": "ok"})
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"AI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
