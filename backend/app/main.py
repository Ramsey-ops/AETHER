from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db import CHART_SCREENSHOTS_DIR, SCREENSHOTS_DIR, init_db
from app.routers import analysis, briefing, chart_analysis, goals, journal, markets, news

app = FastAPI(title="Aether API", version="0.1.0")

init_db()

# Vite dev server origins. Tighten this before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(briefing.router)
app.include_router(analysis.router)
app.include_router(markets.router)
app.include_router(news.router)
app.include_router(journal.router)
app.include_router(goals.router)
app.include_router(chart_analysis.router)

app.mount("/media/journal", StaticFiles(directory=SCREENSHOTS_DIR), name="journal-media")
app.mount("/media/charts", StaticFiles(directory=CHART_SCREENSHOTS_DIR), name="chart-media")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
