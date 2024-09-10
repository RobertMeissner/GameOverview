import os

import pyarrow.parquet as pq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.constants import APP_ID, RATING_FIELD, game_name, played_flag

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your specific frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

columns_to_transfer = [game_name, APP_ID, RATING_FIELD, played_flag]


@app.get("/data/{filename}")
async def get_parquet_file(filename: str):
    file_path = os.path.join("../data", filename)  # Ensure this path is correct
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    print(f"Handling file {file_path}")
    # Read the Parquet file using PyArrow
    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()  # ["game_name"]
        df_filtered = df[columns_to_transfer]
        df[played_flag] = df[played_flag].astype(bool)
        # Convert DataFrame to JSON
        json_data = df_filtered.to_dict(orient="records")
        print(len(json_data))
        return JSONResponse(content=json_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "FastAPI is running!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
