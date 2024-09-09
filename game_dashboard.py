import pandas as pd
import streamlit as st

from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    CUSTOM_RATING,
    EDITABLE_DATA_FILEPATH,
    HASH,
    HIDE_FIELD,
    MINIMUM_RATING,
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    URL,
    game_name,
    played_flag,
    store_name,
)
from src.utils import load_data, save_data

overview_columns = [
    game_name,
    APP_ID,
    URL,
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    played_flag,
    HIDE_FIELD,
    "total_reviews",
    store_name,
    CORRECTED_APP_ID,
    HASH,
]

editable_columns = [played_flag, HIDE_FIELD, CORRECTED_APP_ID]
editable_columns_to_save = [*editable_columns, HASH, APP_ID, game_name]


def save_editable_data(df):  # df: pd.DataFrame
    save_data(df, filename=EDITABLE_DATA_FILEPATH)
    st.session_state.df = update_with_edited_data(
        st.session_state.df.copy(deep=True), df
    )


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe():

    df_overview = st.session_state.df[overview_columns]

    st.sidebar.write("### Filter rows:")

    if st.sidebar.checkbox("Only not-played games?"):
        df_overview = df_overview[df_overview[played_flag] == False]  # noqa: E712

    if st.sidebar.checkbox("Only rated games?", value=True):
        df_overview = df_overview[df_overview["total_reviews"] != -1]

    if st.sidebar.checkbox("Only 'good' games?", value=True):
        df_overview = df_overview[df_overview[RATING_FIELD] >= MINIMUM_RATING]

    if not st.sidebar.checkbox("Show hidden games?", value=False):
        df_overview = df_overview[~df_overview[HIDE_FIELD]]

    # Fetch unique stores for selection
    store_list = df_overview[store_name].unique()
    selected_stores = st.sidebar.multiselect(
        "Select Stores:", store_list, default=store_list
    )
    df_overview = df_overview[df_overview[store_name].isin(selected_stores)]

    st.write(
        f"Number of games: {len(df_overview)}. Hidden: {st.session_state.df[HIDE_FIELD].sum()}"
    )

    df_overview[CUSTOM_RATING] = (
        df_overview[RATING_FIELD] * df_overview[REVIEW_SCORE_FIELD] / 9
    )
    # sort columns
    df_overview.insert(0, game_name, df_overview.pop(game_name))
    df_overview.insert(1, RATING_FIELD, df_overview.pop(RATING_FIELD))
    df_overview.insert(2, REVIEW_SCORE_FIELD, df_overview.pop(REVIEW_SCORE_FIELD))
    df_overview.insert(3, CUSTOM_RATING, df_overview.pop(CUSTOM_RATING))

    column_config = {
        URL: st.column_config.LinkColumn(
            URL,
            max_chars=100,
            display_text="https://store\.steampowered\.com/app/([0-9]*)",  # noqa: W605
            disabled=True,
        ),
        game_name: st.column_config.TextColumn(game_name, width="large"),
    }

    df_overview = df_overview.sort_values(by=CUSTOM_RATING, ascending=False)

    columns_to_show = df_overview.columns.to_list()

    with st.form("data_editor_form"):
        submit_button = st.form_submit_button("Save changes to disk")
        edited_df = st.data_editor(
            df_overview[columns_to_show],
            column_config=column_config,
            hide_index=True,
            disabled=[s for s in columns_to_show if s not in [played_flag, HIDE_FIELD]],
            height=500,  # min(max(df_overview.shape[0] * 30, 30), 3000)
            # on_change=save_editable_data # FIXME: How to hand over data?
        )

        if submit_button:
            save_editable_data(edited_df[editable_columns_to_save])
    # save_changes(st.session_state.raw_df, edited_df)


def update_with_edited_data(
    df_original: pd.DataFrame, df_edited: pd.DataFrame
) -> pd.DataFrame:
    # FIXME sometimes hash is double, so far only for one epic game
    df_original = df_original.drop_duplicates(subset=HASH)
    df_edited = df_edited.drop_duplicates(subset=HASH)

    df_original.set_index(HASH, inplace=True)
    df_edited.set_index(HASH, inplace=True)

    # Update the original data with the edited data
    df_original.update(df_edited)

    df_original[HIDE_FIELD] = df_original[HIDE_FIELD].astype(bool)
    return df_original.reset_index()


if __name__ == "__main__":
    if "df" not in st.session_state:
        st.session_state.df_editable = load_data(filename=EDITABLE_DATA_FILEPATH)
        st.session_state.df = update_with_edited_data(
            load_data(), df_edited=st.session_state.df_editable
        )

    st.set_page_config(
        page_title=None,
        page_icon=None,
        layout="wide",
        initial_sidebar_state="auto",
        menu_items=None,
    )
    display_dataframe()
