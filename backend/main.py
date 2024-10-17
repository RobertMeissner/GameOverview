import os

import pandas as pd
import pyarrow.parquet as pq
from constants import DATA_FILEPATH, LATER_FIELD, THUMBNAIL_URL
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from request_rating import game_by_app_id, steam_rating
from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    DATA_FOLDER,
    HASH,
    HIDE_FIELD,
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    found_game_name,
    game_name,
    played_flag,
    store_name,
)
from src.game_ratings import game_ratings
from starlette.responses import FileResponse
from thumbnails import download_thumbnail
from utils import process_data

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your specific frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

columns_to_transfer = [
    game_name,
    APP_ID,
    RATING_FIELD,
    played_flag,
    HIDE_FIELD,
    REVIEW_SCORE_FIELD,
    HASH,
    found_game_name,
    CORRECTED_APP_ID,
    store_name,
    "reviewsRating",
    "storeLink",
    LATER_FIELD,
]


@app.get("/data/{filename}")
async def get_parquet_file(filename: str):
    file_path = os.path.join(DATA_FOLDER, filename)  # Ensure this path is correct
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    # Read the Parquet file using PyArrow
    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()  # ["game_name"]
        df_filtered = df[columns_to_transfer]
        df[played_flag] = df[played_flag].astype(bool)
        df[HIDE_FIELD] = df[HIDE_FIELD].astype(bool)
        # Convert DataFrame to JSON
        json_data = df_filtered.to_dict(orient="records")
        print(len(json_data))
        return JSONResponse(content=json_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Define a Pydantic model for the expected input
class UpdateRequest(BaseModel):
    column: str
    index: int
    value: bool | int


@app.post("/data/{filename}/update")
async def update_played_flag(filename: str, props: UpdateRequest):
    file_path = os.path.join(DATA_FOLDER, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Read the existing Parquet file
        table = pq.read_table(file_path)
        df = table.to_pandas()

        # Check if the index is valid
        if props.index < 0 or props.index >= len(df):
            raise HTTPException(status_code=400, detail="Invalid index")

        # Update the specified column
        if props.column not in df.columns:
            raise HTTPException(status_code=400, detail="Column not found")

        df.at[props.index, props.column] = props.value  # Update the DataFrame

        # Save the updated DataFrame back to Parquet
        df.to_parquet(file_path, index=False)

        return {"message": "Update successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Define a Pydantic model for the expected input
class NewItemRequest(BaseModel):
    name: str
    app_id: int
    store: str


class NewItemFoundResponse(BaseModel):
    name: str
    app_id: int
    store: str
    thumbnail_url: str


@app.post("/games/add")
def search_game_by_name(props: NewItemRequest) -> NewItemFoundResponse:
    if props.store not in ["gog", "steam"]:
        raise HTTPException(status_code=400, detail="Store not found")

    item = NewItemFoundResponse(
        name=props.name, app_id=props.app_id, store=props.store, thumbnail_url=""
    )
    # TODO: Decouple this
    if item.app_id != 0:
        if item.store == "gog":
            pass
        elif item.store == "steam":
            response = game_by_app_id(item.app_id)
            if "error" in response.keys():
                raise HTTPException(status_code=400, detail=response["error"])

            item.name = response[game_name]
            item.thumbnail_url = response["thumbnail_url"]

    return item  # Return results with 'not-found' if no matches were found


@app.post("/games/create")
def create_game(props: NewItemFoundResponse):
    if props.store not in ["gog", "steam"] or props.name == "" or props.app_id == 0:
        raise HTTPException(status_code=400, detail="Store not found")

    file_path = os.path.join(DATA_FILEPATH)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # TODO: Refactor business logic "away"
        table = pq.read_table(file_path)
        df = table.to_pandas()

        if props.app_id in df[APP_ID].values:
            raise HTTPException(
                status_code=409,
                detail=f"Conflict: An app_id '{props.app_id}' already exists in your database.",
            )

        new_row = pd.DataFrame(
            {
                game_name: [props.name],
                APP_ID: [props.app_id],
                store_name: [props.store],
                THUMBNAIL_URL: [props.thumbnail_url],
            }
        )

        new_row = steam_rating(props.app_id, new_row)
        download_thumbnail(props.app_id)
        # Concatenate the new row to the DataFrame
        df = pd.concat([df, new_row], ignore_index=True)
        df = process_data(df)

        # Save the updated DataFrame back to Parquet
        df.to_parquet(file_path, index=False)

        return {"message": "Update successful"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": f"{props.name} was created"}


@app.get("/")
async def root():
    return {"message": "FastAPI is running!"}


@app.post("/data/rerun")
async def merge_dataframes():
    game_ratings()
    return {"detail": "DataFrames merged successfully"}


@app.get("/thumbnail/{app_id}")
def get_thumbnail(app_id: int):
    file_path = f"{DATA_FOLDER}/thumbnails/{app_id}.png"
    if app_id != 0 and os.path.isfile(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="Thumbnail not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
