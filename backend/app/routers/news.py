from datetime import datetime, timezone

from fastapi import APIRouter

from app.models import NewsResponse
from app.services.economic_calendar import create_economic_calendar_client
from app.services.news_aggregator import create_news_aggregator
from app.services.news_interpreter import create_news_interpreter

router = APIRouter(prefix="/api/news", tags=["news"])

calendar = create_economic_calendar_client()
aggregator = create_news_aggregator()
interpreter = create_news_interpreter()


@router.get("", response_model=NewsResponse)
def get_news() -> NewsResponse:
    news = aggregator.get_news()

    interpretations = interpreter.interpret(news.headlines)
    ai_connected = interpretations is not None
    if interpretations:
        for i, result in interpretations.items():
            headline = news.headlines[i]
            headline.aiInterpreted = True
            headline.rootCause = result.rootCause
            headline.marketImplication = result.marketImplication
            headline.tradeImpact = result.tradeImpact
            headline.institutionalTake = result.institutionalTake

    calendar_events = calendar.get_today()
    next_high_impact = calendar.get_next_high_impact()
    calendar_connected = getattr(calendar, "last_call_was_live", False)

    return NewsResponse(
        date=datetime.now(timezone.utc).date().isoformat(),
        nextHighImpact=next_high_impact,
        calendar=calendar_events,
        sentiment=news.sentiment,
        headlines=news.headlines,
        economicCalendarConnected=calendar_connected,
        newsConnected=len(news.sourcesConnected) > 0,
        newsSourcesConnected=news.sourcesConnected,
        aiInterpretationConnected=ai_connected,
    )
