"""GoF Chain of Responsibility: remote FX rate providers."""

from __future__ import annotations

from abc import ABC, abstractmethod

import httpx

from app.core.config import settings


class FxProvider(ABC):
    """Handler in a Chain of Responsibility for live FX quotes."""

    name: str

    def __init__(self, successor: FxProvider | None = None):
        self._successor = successor

    def fetch(self, base: str, quote: str) -> tuple[float, str]:
        try:
            return self._try_fetch(base, quote)
        except Exception:
            if self._successor is None:
                raise
            return self._successor.fetch(base, quote)

    @abstractmethod
    def _try_fetch(self, base: str, quote: str) -> tuple[float, str]:
        raise NotImplementedError


class IdentityFxProvider(FxProvider):
    name = "identity"

    def _try_fetch(self, base: str, quote: str) -> tuple[float, str]:
        if base == quote:
            return 1.0, self.name
        raise RuntimeError("not identity")


class FrankfurterFxProvider(FxProvider):
    name = "frankfurter"

    def _try_fetch(self, base: str, quote: str) -> tuple[float, str]:
        url = f"{settings.fx_api_base.rstrip('/')}/latest"
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url, params={"from": base, "to": quote})
            if resp.status_code != 200:
                raise RuntimeError(f"frankfurter status {resp.status_code}")
            data = resp.json()
            if quote not in data.get("rates", {}):
                raise RuntimeError(f"frankfurter missing {quote}")
            return float(data["rates"][quote]), self.name


class OpenErApiFxProvider(FxProvider):
    name = "open_er_api"

    def _try_fetch(self, base: str, quote: str) -> tuple[float, str]:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(f"https://open.er-api.com/v6/latest/{base}")
            resp.raise_for_status()
            data = resp.json()
            if data.get("result") != "success" or quote not in data.get("rates", {}):
                raise RuntimeError(f"open.er-api missing {quote}")
            return float(data["rates"][quote]), self.name


def build_fx_provider_chain() -> FxProvider:
    """Wire Identity → Frankfurter → open.er-api (Chain of Responsibility)."""
    return IdentityFxProvider(
        FrankfurterFxProvider(
            OpenErApiFxProvider()
        )
    )
