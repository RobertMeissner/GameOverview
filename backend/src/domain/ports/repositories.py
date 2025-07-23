from typing import Protocol


class UserRepository(Protocol):
    """A users repository."""

    def __init__(self) -> None:
        """Init."""
