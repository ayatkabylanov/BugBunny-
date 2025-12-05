from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import applications

# create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DataHub API", version="1.0")

# allow CORS from frontend (adjust origins as needed)
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # add your frontend origin(s) if different
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # allow origins you use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)

@app.get("/")
def root():
    return {"ok": True, "service": "DataHub API"}
