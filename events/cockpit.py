from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Mapping


class EventType(str, Enum):
    PRICE = "price"
    TICK = "tick"
    INTERVAL = "interval"
    CONTINUITY = "continuity"
    CORPORATE_ACTION = "corporate_action"
    SECURITY = "security"
    OPTION_CHAIN = "option_chain"
    OPTION_SURFACE = "option_surface"


@dataclass(frozen=True, slots=True)
class CockpitEvent:
    event_type: EventType
    vendor: str
    symbol: str
    occurred_at: datetime
    received_at: datetime
    data: Mapping[str, object]

    def __post_init__(self) -> None:
        if not self.vendor.strip():
            raise ValueError("vendor must not be empty")
        if not self.symbol.strip():
            raise ValueError("symbol must not be empty")
        if self.occurred_at.tzinfo is None or self.received_at.tzinfo is None:
            raise ValueError("event timestamps must include a timezone")
