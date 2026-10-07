from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable, Mapping
from datetime import datetime

from events import CockpitEvent


class AdapterError(ValueError):
    """Raised when a vendor payload cannot be translated into a cockpit event."""


class VendorAdapter(ABC):
    vendor: str

    def __init__(self, vendor: str) -> None:
        normalized_vendor = vendor.strip().lower()
        if not normalized_vendor:
            raise ValueError("vendor must not be empty")
        self.vendor = normalized_vendor

    @abstractmethod
    def adapt(
        self,
        payload: Mapping[str, object],
        *,
        received_at: datetime,
    ) -> Iterable[CockpitEvent]:
        """Translate one vendor payload into engine-owned cockpit events."""
