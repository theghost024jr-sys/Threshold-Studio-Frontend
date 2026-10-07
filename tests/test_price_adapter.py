from datetime import datetime, timezone

import pytest

from adapters import AdapterError, PriceAdapter
from events import EventType


def test_price_adapter_emits_engine_owned_price_event() -> None:
    adapter = PriceAdapter("Intrinio")
    received_at = datetime(2026, 10, 7, 8, 40, tzinfo=timezone.utc)

    event = next(
        adapter.adapt(
            {
                "symbol": "aapl",
                "price": 252.13,
                "currency": "usd",
                "timestamp": datetime(2026, 10, 7, 8, 39, tzinfo=timezone.utc),
                "vendorOnlyField": "not forwarded",
            },
            received_at=received_at,
        )
    )

    assert event.event_type is EventType.PRICE
    assert event.vendor == "intrinio"
    assert event.symbol == "AAPL"
    assert event.received_at == received_at
    assert event.data == {"price": 252.13, "currency": "USD"}


def test_price_adapter_rejects_vendor_payload_without_a_timezone() -> None:
    adapter = PriceAdapter("Polygon")

    with pytest.raises(AdapterError, match="timezone"):
        next(
            adapter.adapt(
                {
                    "symbol": "AAPL",
                    "price": 252.13,
                    "timestamp": datetime(2026, 10, 7, 8, 39),
                },
                received_at=datetime(2026, 10, 7, 8, 40, tzinfo=timezone.utc),
            )
        )
