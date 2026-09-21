"""GoF Strategy + Factory: per-line product cost entry modes."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable

from app.services.costing_math import money


class LineCostStrategy(ABC):
    """Strategy: convert a batch line into a local unit product cost."""

    name: str

    @abstractmethod
    def unit_cost(self, item: dict, exchange_rate: float | None) -> float:
        raise NotImplementedError


class AlreadyLocalLineCost(LineCostStrategy):
    name = "already_local"

    def unit_cost(self, item: dict, exchange_rate: float | None) -> float:
        if item.get("local_unit_product_cost") is None:
            raise ValueError("Already-Local line missing local_unit_product_cost")
        return money(float(item["local_unit_product_cost"]))


class AutoFxLineCost(LineCostStrategy):
    name = "auto_fx"

    def unit_cost(self, item: dict, exchange_rate: float | None) -> float:
        if item.get("foreign_unit_price") is None:
            raise ValueError("Auto FX line missing foreign_unit_price")
        if exchange_rate is None:
            raise ValueError("Exchange rate required for Auto FX lines")
        return money(float(item["foreign_unit_price"]) * float(exchange_rate))


_REGISTRY: dict[str, Callable[[], LineCostStrategy]] = {
    AlreadyLocalLineCost.name: AlreadyLocalLineCost,
    AutoFxLineCost.name: AutoFxLineCost,
}


def get_line_cost_strategy(mode: str | None) -> LineCostStrategy:
    """Simple Factory: resolve line-cost Strategy by mode name."""
    key = (mode or AlreadyLocalLineCost.name).strip().lower()
    factory = _REGISTRY.get(key)
    if not factory:
        # Unknown modes fall back to Already-Local so mixed batches stay resilient.
        return AlreadyLocalLineCost()
    return factory()
