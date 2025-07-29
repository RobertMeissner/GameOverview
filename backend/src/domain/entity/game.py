from __future__ import annotations

import uuid
from dataclasses import dataclass, field
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

    name: str
    platforms: list[str]  # enum?
    play_status: PlayStatus

    steam_id: int  # Identifier for steam
    gog_id: int  # Identifier for GoG

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
