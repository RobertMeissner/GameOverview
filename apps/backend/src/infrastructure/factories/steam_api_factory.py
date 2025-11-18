from adapters.steam_api.steam_api_adapter import SteamAPIAdapter
from domain.ports.steam_api import SteamAPI


def create_steam_api() -> SteamAPI:
    """Create Steam API adapter factory."""
    return SteamAPIAdapter()
