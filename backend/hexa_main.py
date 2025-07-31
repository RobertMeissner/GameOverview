import os
import sys

from adapters.game_catalog.steam_json_catalog_adapter import SteamJSONCatalogAdapter
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from application.services.game_service import GameService
from application.use_cases.catalog import Catalog
from domain.entity.game import Game
from infrastructure.factories.json_catalog_factory import steam_json_catalog_adapter
from infrastructure.factories.steam_api_factory import create_steam_api

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GameResponse(BaseModel):
    id: str
    steam_id: int
    name: str

    @classmethod
    def from_game(cls, game: Game) -> "GameResponse":
        return cls(id=game.id, steam_id=game.steam_id, name=game.name)


class SteamGameLookupResponse(BaseModel):
    success: bool
    game: dict | None = None
    error: str | None = None


class SteamGameSearchResponse(BaseModel):
    app_id: int
    name: str


class GameAddRequest(BaseModel):
    name: str
    app_id: str
    store: str
    status: str


def get_game_service() -> GameService:
    return GameService(steam_json_catalog_adapter, create_steam_api)


@app.get("/api/games/catalog")
def get_all_games_in_catalog(service: GameService = Depends(get_game_service)) -> list[GameResponse]:
    return [GameResponse.from_game(game) for game in service.all_games()]


@app.get("/api/games/steam/{steam_id}")
def get_steam_game(steam_id: int, service: GameService = Depends(get_game_service)) -> GameResponse:
    return GameResponse.from_game(service.steam_game(steam_id))


@app.get("/api/steam/lookup/{app_id}")
def lookup_steam_game_by_app_id(app_id: int, service: GameService = Depends(get_game_service)) -> SteamGameLookupResponse:
    """Look up Steam game by app ID."""
    try:
        game_data = service.lookup_steam_game_by_app_id(app_id)
        if game_data:
            return SteamGameLookupResponse(success=True, game=game_data)
        else:
            return SteamGameLookupResponse(success=False, error="Game not found")
    except Exception as e:
        return SteamGameLookupResponse(success=False, error=str(e))


@app.get("/api/steam/search")
def search_steam_game_by_name(name: str, service: GameService = Depends(get_game_service)) -> SteamGameSearchResponse:
    """Search for Steam game by name."""
    app_id, matched_name = service.search_steam_game_by_name(name)
    return SteamGameSearchResponse(app_id=app_id, name=matched_name)


@app.post("/api/games")
def add_game(game_request: GameAddRequest, service: GameService = Depends(get_game_service)) -> SteamGameLookupResponse:
    """Add a game - this endpoint matches the frontend expectation."""
    try:
        if game_request.store == "steam" and game_request.app_id:
            # Look up the game by app_id to get full details
            app_id = int(game_request.app_id)
            game_data = service.lookup_steam_game_by_app_id(app_id)
            if game_data:
                # Add additional metadata
                response_game = {
                    **game_data,
                    "app_id": app_id,
                    "store": game_request.store,
                    "status": game_request.status,
                }
                return SteamGameLookupResponse(success=True, game=response_game)
            else:
                return SteamGameLookupResponse(success=False, error="Steam game not found")
        else:
            # For non-steam games or games without app_id, return basic info
            response_game = {
                "game_name": game_request.name,
                "app_id": game_request.app_id,
                "store": game_request.store,
                "status": game_request.status,
                "thumbnail_url": "",
            }
            return SteamGameLookupResponse(success=True, game=response_game)
    except Exception as e:
        return SteamGameLookupResponse(success=False, error=str(e))


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc)})


if __name__ == "__main__":
    import uvicorn

    # For CLI usage (python script)
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        print("No functionality implemented")
    else:
        # Start FastAPI server
        uvicorn.run(app, host="0.0.0.0", port=8001)
