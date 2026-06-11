from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, copilot, report

app = FastAPI(title="FinSight AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(copilot.router, prefix="/api")
app.include_router(report.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok", "app": "FinSight AI"}