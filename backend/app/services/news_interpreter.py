"""AI news interpretation layer (Part 3A, sections 6-7): for the
highest-impact headlines only (one batched call, to control cost and
rate limits), ask an LLM to add root-cause context, a hedged
market-implication read, and a trade-impact judgment relative to the app's
four watchlist pairs.

These are AI INTERPRETATION fields layered on top of the FACT fields
(headline text/source/summary/sentiment) news_aggregator.py already built —
never presented as certain, never replacing the source. This is Gemini/
Claude reasoning about already-published text, not the Phase 3 trained
trading model, which still doesn't exist until a strategy is provided.

Gemini is preferred (genuinely free tier, no billing needed); Anthropic is
the fallback if only that key is configured. Both speak the same
InterpretationResult contract so the router/aggregator don't care which
one ran. Neither key configured -> NotConfiguredNewsInterpreter, headlines
keep FACT fields only.
"""

import json
import time
from dataclasses import dataclass
from typing import Optional, Protocol

import httpx

from app.config import settings
from app.models import Headline, TradeImpact

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"

_MAX_HEADLINES_TO_INTERPRET = 8
_CACHE_TTL_SECONDS = 1200

_VALID_TRADE_IMPACTS = {"in_favor", "not_in_favor", "neutral", "news_risk"}

_SYSTEM_PROMPT = """You are Aether's news-interpretation layer, reading already-published forex news for a trader who only watches four pairs: XAUUSD, EURUSD, USDJPY, GBPUSD.

For each headline given, return:
- "rootCause": one sentence on the underlying reason/context, drawn ONLY from the text given — never invent facts not present. Use null if the text gives no reason beyond the headline itself.
- "marketImplication": 1-2 sentences on likely market significance. Always hedge ("could", "may", "likely") — never state a future outcome as certain.
- "tradeImpact": one of "in_favor", "not_in_favor", "neutral", "news_risk" — judged against a trader holding/considering setups on the four pairs above. Use "news_risk" for high-volatility/high-impact events where the right move is to wait, not read directional bias.
- "institutionalTake": ONE short sentence (max ~25 words) in a confident institutional-desk-note voice that blends the directional read with its reason, e.g. "Bullish for GBP against EUR due to elevated Gilt yields and sticky inflation expectations." or "Strong technical momentum on XAUUSD toward the 2,400.00 liquidity target — watch for pullback entries." Still your interpretation, not a fact — but written as a house view, not hedged like marketImplication.

Return ONLY a JSON array, one object per input headline in the same order, each with "index" (matching the input), "rootCause", "marketImplication", "tradeImpact", "institutionalTake". No prose outside the JSON, no markdown fences."""


@dataclass
class InterpretationResult:
    rootCause: Optional[str]
    marketImplication: str
    tradeImpact: TradeImpact
    institutionalTake: str


class NewsInterpreter(Protocol):
    def interpret(self, headlines: list[Headline]) -> Optional[dict[int, InterpretationResult]]: ...


class NotConfiguredNewsInterpreter:
    def interpret(self, headlines: list[Headline]) -> Optional[dict[int, InterpretationResult]]:
        return None


def _select_batch(headlines: list[Headline]) -> list[tuple[int, Headline]]:
    impact_rank = {"high": 0, "medium": 1, "low": 2}
    indexed = list(enumerate(headlines))
    indexed.sort(key=lambda pair: impact_rank.get(pair[1].impact, 2))
    return indexed[:_MAX_HEADLINES_TO_INTERPRET]


def _build_payload(batch: list[tuple[int, Headline]]) -> str:
    items = [
        {
            "index": i,
            "text": h.text,
            "summary": h.summary,
            "source": h.source,
            "affectedAssets": h.affectedAssets,
            "impact": h.impact,
            "sentimentLabel": h.sentimentLabel,
        }
        for i, h in batch
    ]
    return json.dumps(items)


def _strip_markdown_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    return cleaned.strip()


def _parse_results(raw_text: str) -> Optional[dict[int, InterpretationResult]]:
    try:
        parsed = json.loads(_strip_markdown_fence(raw_text))
        results: dict[int, InterpretationResult] = {}
        for entry in parsed:
            trade_impact = entry.get("tradeImpact")
            if trade_impact not in _VALID_TRADE_IMPACTS:
                continue
            results[int(entry["index"])] = InterpretationResult(
                rootCause=entry.get("rootCause") or None,
                marketImplication=entry.get("marketImplication") or "",
                tradeImpact=trade_impact,
                institutionalTake=entry.get("institutionalTake") or entry.get("marketImplication") or "",
            )
        return results or None
    except (ValueError, KeyError, TypeError) as e:
        print(f"[news_interpreter] failed to parse model output: {e}")
        return None


class LiveGeminiNewsInterpreter:
    def __init__(self, api_key: str):
        self._api_key = api_key
        self._cache: dict[str, tuple[float, Optional[dict[int, InterpretationResult]]]] = {}

    def interpret(self, headlines: list[Headline]) -> Optional[dict[int, InterpretationResult]]:
        batch = _select_batch(headlines)
        if not batch:
            return None
        cache_key = "|".join(f"{i}:{h.text}" for i, h in batch)
        cached = self._cache.get(cache_key)
        if cached and (time.monotonic() - cached[0]) < _CACHE_TTL_SECONDS:
            return cached[1]

        result = self._call(batch)
        if result is not None:
            self._cache[cache_key] = (time.monotonic(), result)
        return result

    def _call(self, batch: list[tuple[int, Headline]]) -> Optional[dict[int, InterpretationResult]]:
        try:
            res = httpx.post(
                GEMINI_URL,
                headers={"x-goog-api-key": self._api_key, "Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": _build_payload(batch)}]}],
                    "systemInstruction": {"parts": [{"text": _SYSTEM_PROMPT}]},
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
                },
                timeout=20.0,
            )
            res.raise_for_status()
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return _parse_results(text)
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as e:
            print(f"[news_interpreter] Gemini call failed: {e}")
            return None


class LiveAnthropicNewsInterpreter:
    def __init__(self, api_key: str):
        self._api_key = api_key
        self._cache: dict[str, tuple[float, Optional[dict[int, InterpretationResult]]]] = {}

    def interpret(self, headlines: list[Headline]) -> Optional[dict[int, InterpretationResult]]:
        batch = _select_batch(headlines)
        if not batch:
            return None
        cache_key = "|".join(f"{i}:{h.text}" for i, h in batch)
        cached = self._cache.get(cache_key)
        if cached and (time.monotonic() - cached[0]) < _CACHE_TTL_SECONDS:
            return cached[1]

        result = self._call(batch)
        if result is not None:
            self._cache[cache_key] = (time.monotonic(), result)
        return result

    def _call(self, batch: list[tuple[int, Headline]]) -> Optional[dict[int, InterpretationResult]]:
        try:
            res = httpx.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": self._api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": ANTHROPIC_MODEL,
                    "max_tokens": 1500,
                    "system": _SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": _build_payload(batch)}],
                },
                timeout=20.0,
            )
            res.raise_for_status()
            data = res.json()
            text = data["content"][0]["text"]
            return _parse_results(text)
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as e:
            print(f"[news_interpreter] Anthropic call failed: {e}")
            return None


def create_news_interpreter() -> NewsInterpreter:
    if settings.gemini_api_key:
        return LiveGeminiNewsInterpreter(settings.gemini_api_key)
    if settings.anthropic_api_key:
        return LiveAnthropicNewsInterpreter(settings.anthropic_api_key)
    return NotConfiguredNewsInterpreter()
