from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.breakdown import router as breakdown_router
from app.routes.simplify import router as simplify_router
from app.routes.focus import router as focus_router

app = FastAPI(title="Neuro Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(breakdown_router, prefix="/api")
app.include_router(simplify_router, prefix="/api")
app.include_router(focus_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Neuro Assistant API is running!"}

