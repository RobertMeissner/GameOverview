import streamlit as st

from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    HIDE_FIELD,
    URL,
    found_game_name,
    game_name,
    played_flag,
)
from src.utils import load_data


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe():
    df_correction = st.session_state.df_correction
    mask = (df_correction[game_name] != df_correction[found_game_name]) | (
        df_correction[APP_ID] == 0
    )
    df_correction = df_correction[mask]

    columns_to_show = [
        game_name,
        found_game_name,
        APP_ID,
        CORRECTED_APP_ID,
        URL,
        played_flag,
        HIDE_FIELD,
    ]

    # if st.sidebar.checkbox("Show Rows with Differences"):
    #     # Display rows where selected columns have different values
    #     mask = df_overview[game_name] != df_overview[found_game_name]
    #     df_overview = df[mask]

    st.write(f"Number of games: {len(df_correction)}.")

    column_config = {
        URL: st.column_config.LinkColumn(
            URL,
            max_chars=100,
            display_text=r"https://store\.steampowered\.com/app/([0-9]*)",  # noqa: W605
            disabled=True,
        ),
        game_name: st.column_config.TextColumn(game_name, width="large"),
    }

    df_correction = df_correction.sort_values(by=game_name, ascending=False)

    st.data_editor(
        df_correction[columns_to_show],
        column_config=column_config,
        hide_index=True,
        disabled=[
            s
            for s in columns_to_show
            if s not in [played_flag, HIDE_FIELD, CORRECTED_APP_ID]
        ],
        height=min(max(df_correction.shape[0] * 30, 30), 3000),
    )


if "df_correction" not in st.session_state:
    st.session_state.df_correction = load_data()

st.set_page_config(
    page_title=None,
    page_icon=None,
    layout="wide",
    initial_sidebar_state="auto",
    menu_items=None,
)
display_dataframe()
