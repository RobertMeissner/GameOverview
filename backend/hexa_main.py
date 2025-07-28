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


def get_game_service() -> GameService:
    return GameService(steam_json_catalog_adapter)


@app.get("/api/games/catalog")
def get_all_games_in_catalog(service: GameService = Depends(get_game_service)) -> list[GameResponse]:
    return [GameResponse.from_game(game) for game in service.all_games()]


@app.get("/api/games/steam/{steam_id}")
def get_steam_game(steam_id: int, service: GameService = Depends(get_game_service)) -> GameResponse:
    return GameResponse.from_game(service.steam_game(steam_id))


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
