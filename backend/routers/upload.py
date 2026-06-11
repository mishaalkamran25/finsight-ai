from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import pathlib
from services.parser import parse_file, compute_metrics, build_context_string

router = APIRouter()
SESSION = {}

DEMO_PATH = pathlib.Path(__file__).parent.parent / "sample_data.csv"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
        df = parse_file(content, file.filename)
        metrics = compute_metrics(df)
        context = build_context_string(df, metrics)
        SESSION["df"] = df
        SESSION["metrics"] = metrics
        SESSION["context"] = context
        SESSION["filename"] = file.filename
        return JSONResponse({
            "status": "ok",
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "metrics": metrics,
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/demo")
async def load_demo():
    try:
        content = DEMO_PATH.read_bytes()
        df = parse_file(content, "sample_data.csv")
        metrics = compute_metrics(df)
        context = build_context_string(df, metrics)
        SESSION["df"] = df
        SESSION["metrics"] = metrics
        SESSION["context"] = context
        SESSION["filename"] = "Meridian Consumer Goods — Demo Dataset"
        return JSONResponse({
            "status": "ok",
            "filename": SESSION["filename"],
            "rows": len(df),
            "columns": list(df.columns),
            "metrics": metrics,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session")
def get_session():
    if not SESSION.get("df") is not None:
        return {"loaded": False}
    return {
        "loaded": True,
        "filename": SESSION.get("filename"),
        "metrics": SESSION.get("metrics"),
    }
