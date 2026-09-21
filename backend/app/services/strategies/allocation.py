"""GoF Strategy + Factory: shipment cost allocation basis."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable


class AllocationStrategy(ABC):
    """Strategy: choose the proportional basis for shipping/duty/VAT shares."""

    name: str

    @abstractmethod
    def basis(self, prepared: list[dict]) -> list[float]:
        raise NotImplementedError


class QuantityAllocation(AllocationStrategy):
    name = "quantity"

    def basis(self, prepared: list[dict]) -> list[float]:
        return [p["quantity"] for p in prepared]


class WeightAllocation(AllocationStrategy):
    name = "weight"

    def basis(self, prepared: list[dict]) -> list[float]:
        if any(p["weight"] <= 0 for p in prepared):
            raise ValueError("Weight allocation requires weight_kg > 0 on every line")
        return [p["weight"] for p in prepared]


class ValueAllocation(AllocationStrategy):
    name = "value"

    def basis(self, prepared: list[dict]) -> list[float]:
        return [p["line_product"] for p in prepared]


_REGISTRY: dict[str, Callable[[], AllocationStrategy]] = {
    QuantityAllocation.name: QuantityAllocation,
    WeightAllocation.name: WeightAllocation,
    ValueAllocation.name: ValueAllocation,
}


def get_allocation_strategy(method: str) -> AllocationStrategy:
    """Simple Factory: resolve allocation Strategy by method name."""
    key = (method or "").strip().lower()
    factory = _REGISTRY.get(key)
    if not factory:
        raise ValueError("method must be weight, quantity, or value")
    return factory()
