from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import datetime, timezone

from events import CockpitEvent, EventType

from .base import AdapterError, VendorAdapter


class PriceAdapter(VendorAdapter):
    """Template for a vendor-specific real-time or end-of-day price adapter.

    Subclasses only extract vendor fields. Consumers receive the stable
    ``CockpitEvent`` contract and never access the original payload.
    """

    def adapt(
        self,
        payload: Mapping[str, object],
        *,
        received_at: datetime,
    ) -> Iterable[CockpitEvent]:
        symbol = self.symbol_from(payload)
        price = self.price_from(payload)
        occurred_at = self.occurred_at_from(payload)
        yield CockpitEvent(
            event_type=EventType.PRICE,
            vendor=self.vendor,
            symbol=symbol,
            occurred_at=occurred_at,
            received_at=received_at,
            data={"price": price, "currency": self.currency_from(payload)},
        )

    def symbol_from(self, payload: Mapping[str, object]) -> str:
        return self.required_text(payload, "symbol").upper()

    def price_from(self, payload: Mapping[str, object]) -> float:
        value = payload.get("price")
        if not isinstance(value, int | float):
            raise AdapterError("price must be numeric")
        return float(value)

    def occurred_at_from(self, payload: Mapping[str, object]) -> datetime:
        value = payload.get("timestamp")
        if not isinstance(value, datetime):
            raise AdapterError("timestamp must be a datetime")
        if value.tzinfo is None:
            raise AdapterError("timestamp must include a timezone")
        return value.astimezone(timezone.utc)

    def currency_from(self, payload: Mapping[str, object]) -> str:
        value = payload.get("currency", "USD")
        if not isinstance(value, str) or not value.strip():
            raise AdapterError("currency must be a non-empty string")
        return value.upper()

    @staticmethod
    def required_text(payload: Mapping[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or not value.strip():
            raise AdapterError(f"{key} must be a non-empty string")
        return value.strip()
