from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # None until a real key is provided — every consumer must treat that as
    # "market data provider not configured," not an error to work around.
    twelve_data_api_key: str | None = None

    # Optional. Free key from https://www.alphavantage.co/support/#api-key
    # enables real news headlines + sentiment on Screen 4. Free tier is
    # ~25 requests/day, so the client caches aggressively. Unset -> the
    # screen falls back to preview headlines, same pattern as market data.
    alpha_vantage_api_key: str | None = None

    # Optional. Free key from https://finnhub.io/register. ~60 calls/min.
    # Powers real forex headlines and (best-effort, may be premium-gated on
    # some accounts) the economic calendar. Unset -> those sockets no-op.
    finnhub_api_key: str | None = None

    # Optional. Free key from https://www.marketaux.com/. ~100 requests/day
    # on the free tier, so cached aggressively. Gives per-entity sentiment
    # for forex/commodity tickers. Unset -> socket no-ops.
    marketaux_api_key: str | None = None

    # Optional. Free key from https://aistudio.google.com/apikey — genuinely
    # free within Gemini's rate limits, no billing setup needed. Preferred
    # provider for the news interpretation layer while testing.
    gemini_api_key: str | None = None

    # Optional. Key from https://console.anthropic.com — billed separately
    # from any claude.ai subscription (API usage, not Pro/Max). Fallback
    # provider for the same interpretation layer if Gemini isn't configured.
    # Both are Claude/Gemini reasoning about already-published news text,
    # not the Phase 3 trained trading model — unset -> headlines carry FACT
    # fields only, no AI interpretation.
    anthropic_api_key: str | None = None


settings = Settings()
