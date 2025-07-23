from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class PlayStatus(Enum):
    """Status of the game for the player.

    # IN_PROGRESS = "in_progress"
    # ABANDONED = "abandoned"
    """

    NOT_STARTED = "not_started"
    COMPLETED = "completed"


@dataclass
class Game:
    """Main entity."""

    id: str  # UUID?
    name: str
    platforms: list[str]  # enum?
    play_status: PlayStatus
