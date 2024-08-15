import pandas as pd
import streamlit as st

from constants import (
    games_folder,
    game_name,
    found_game_name,
    played_flag,
    app_id,
    MINIMUM_RATING,
    RATING_FIELD,
)


def load_data(filename=games_folder + "/" + "data.parquet") -> pd.DataFrame:
    return pd.read_parquet(filename)


# Define columns that should be deactivated by default
columns_off_by_default = [
    "num_reviews",
    "review_score_desc",
    "total_positive",
    "total_negative",
]


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe(df):
    # Setting 'name' column to type string
    df[game_name] = df[game_name].astype(str)
    # Move 'game' column to the first position
    game_column = df.pop(game_name)
    df.insert(0, game_name, game_column)

    st.sidebar.write("### Filter rows:")
    if st.sidebar.checkbox("Show Rows with Differences"):
        # Display rows where selected columns have different values
        mask = df[game_name] != df[found_game_name]
        df = df[mask]
        if not df.empty:
            st.write(f"Rows where {game_name} differs from {found_game_name}")
            # st.dataframe(differing_rows)
        else:
            st.write("No differing rows for the selected columns.")

    if st.sidebar.checkbox("Only not-played games?"):
        # Display rows where selected columns have different values
        mask = df[played_flag] == False  # noqa: E712
        df = df[mask]
        if not df.empty:
            st.write("Non played games")
            # st.dataframe(differing_rows)
        else:
            st.write("Everything played.")

    if st.sidebar.checkbox("Only rated games?"):
        # Display rows where selected columns have different values
        mask = df["total_reviews"] != -1
        df = df[mask]
        if not df.empty:
            st.write("Non rated games")
            # st.dataframe(differing_rows)
        else:
            st.write("Everything rated.")

    if st.sidebar.checkbox("Hide 'bad' games?", value=True):
        df = df[df[RATING_FIELD] >= MINIMUM_RATING]

    st.sidebar.write("### Select the columns to display:")
    columns_to_show = []
    all_columns = df.columns.tolist()
    column_choices = {
        col: st.sidebar.checkbox(col, col not in columns_off_by_default)
        for col in all_columns
    }

    for col, show in column_choices.items():
        if show:
            columns_to_show.append(col)

    st.data_editor(
        df[columns_to_show],
        column_config={
            app_id: st.column_config.LinkColumn(
                app_id,
                max_chars=100,
                display_text="https://store\.steampowered\.com/app/([0-9]*)",  # noqa: W605
            ),
        },
        hide_index=True,
    )

    # st.dataframe(df[columns_to_show])


# If running in Streamlit, load and display the data from file
loaded_data = load_data()


base_steam_url = "https://store.steampowered.com/app/"


def process_data(df: pd.DataFrame) -> pd.DataFrame:
    # Adding a new column with URL
    df[app_id] = df[app_id].apply(lambda x: f"{base_steam_url}{x}")
    return loaded_data


loaded_data = process_data(loaded_data)

st.set_page_config(
    page_title=None,
    page_icon=None,
    layout="wide",
    initial_sidebar_state="auto",
    menu_items=None,
)
st.title("User Ratings Data")
display_dataframe(loaded_data)
