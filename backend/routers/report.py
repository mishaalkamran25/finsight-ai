from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import anthropic
import os
import io
from routers.upload import SESSION
from services.pptx_generator import generate_pptx

router = APIRouter()

COMMENTARY_PROMPT = """You are a senior FP&A analyst writing the executive commentary section of a monthly management report.

Using ONLY the financial data provided, write a structured management commentary with the following sections:

EXECUTIVE SUMMARY:
One paragraph (3–4 sentences) summarizing overall financial performance. Lead with the headline result (favorable/unfavorable vs budget), then explain the top 2 drivers.

KEY VARIANCES:
List the 3–5 most significant budget variances. For each, state the line item, dollar variance, percentage variance, and one sentence on the likely driver. Use bullet points (start each with -).

MANAGEMENT ACTIONS RECOMMENDED:
List 3–4 concrete actions management should consider based on the data. Be specific. Start each with a verb (Investigate, Accelerate, Review, Monitor, etc.).

RULES:
- Use only numbers from the data. Do not invent figures.
- Be concise and direct. No filler language.
- Use FP&A terminology: favorable/unfavorable, bps, headwinds, run rate, YoY, MoM.
- Total length: 200–300 words.
"""

@router.post("/generate-commentary")
async def generate_commentary():
    if not SESSION.get("context"):
        raise HTTPException(status_code=400, detail="No file loaded.")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured.")

    client = anthropic.Anthropic(api_key=api_key)

    try:
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            system=COMMENTARY_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Generate the management commentary for this financial data:\n\n{SESSION['context']}"
            }],
        )
        commentary = response.content[0].text
        SESSION["commentary"] = commentary
        return JSONResponse({"commentary": commentary, "status": "ok"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-report")
async def download_report():
    if not SESSION.get("metrics"):
        raise HTTPException(status_code=400, detail="No data loaded. Upload a file first.")

    commentary = SESSION.get("commentary", "Commentary not yet generated. Please generate commentary first.")
    filename = SESSION.get("filename", "FinSight Report")

    try:
        pptx_bytes = generate_pptx(SESSION["metrics"], commentary, filename)
        return StreamingResponse(
            io.BytesIO(pptx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f'attachment; filename="FinSight_Management_Pack.pptx"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
