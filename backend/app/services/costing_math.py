"""Shared money helpers used by costing strategies and the costing facade."""

from decimal import Decimal, ROUND_HALF_UP

TWOPLACES = Decimal("0.01")


def money(value: float | Decimal) -> float:
    return float(Decimal(str(value)).quantize(TWOPLACES, rounding=ROUND_HALF_UP))
