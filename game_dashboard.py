import numpy as np
import pandas as pd
import streamlit as st
from matplotlib import pyplot as plt

from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    CUSTOM_RATING,
    HIDE_FIELD,
    MINIMUM_RATING,
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    URL,
    found_game_name,
    game_name,
    played_flag,
    store_name,
)
from src.main import save_data
from src.utils import load_data

feature_editable = False

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
]

# Define columns that should be deactivated by default
columns_off_by_default = [
    "num_reviews",
    "review_score_desc",
    "total_positive",
    "total_negative",
    APP_ID,  # RATING_FIELD,
    CORRECTED_APP_ID,  # REVIEW_SCORE_FIELD,
    "total_reviews",
]

editable_columns = [played_flag]


def save_changes(df, edited_df):
    # FIXME: This is hardcore frustrating, toggling filters in the sidebar resets these values - I seemingly misunderstand state
    # Merge raw and edited DataFrames based on 'name'

    applied_changes = 0

    for field_to_compare in [HIDE_FIELD, played_flag, CORRECTED_APP_ID]:
        merged_df = pd.merge(df, edited_df, on=game_name, suffixes=("_raw", "_edited"))
        mask = (
            merged_df[f"{field_to_compare}_raw"]
            != merged_df[f"{field_to_compare}_edited"]
        )
        applied_changes += mask.sum()
        updates_dict = pd.Series(
            merged_df.loc[mask, f"{field_to_compare}_edited"].values,
            index=merged_df.loc[mask, game_name],
        ).to_dict()
        for name, new_hide in updates_dict.items():
            df.loc[df[game_name] == name, field_to_compare] = new_hide

    print(f"Applied {applied_changes} changes.")
    # merge corrected_app_id
    df[CORRECTED_APP_ID] = df[CORRECTED_APP_ID].replace("", 0).fillna(0)

    # drop exact duplicates
    for col in df.columns:
        if not df[col].apply(lambda x: isinstance(x, np.ndarray)).any():
            df[col] = df[col].drop_duplicates(keep="first")
    st.session_state.df = df
    save_data(st.session_state.df.copy(deep=True))


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe():
    df = st.session_state.df.copy(deep=False)
    tab_overview, tab_rating_distribution, tab_correcting_app_id = st.tabs(
        ["Overview", "Rating Distribution", "Correcting App ID"]
    )
    with tab_overview:

        df_overview = df.copy(deep=True)[overview_columns]

        st.sidebar.write("### Filter rows:")
        # if st.sidebar.checkbox("Show Rows with Differences"):
        #     # Display rows where selected columns have different values
        #     mask = df_overview[game_name] != df_overview[found_game_name]
        #     df_overview = df[mask]

        if st.sidebar.checkbox("Only not-played games?"):
            # Display rows where selected columns have different values
            mask = df_overview[played_flag] == False  # noqa: E712
            df_overview = df_overview[mask]

        if st.sidebar.checkbox("Only rated games?", value=True):
            # Display rows where selected columns have different values
            mask = df_overview["total_reviews"] != -1
            df_overview = df_overview[mask]

        if st.sidebar.checkbox("Only 'good' games?", value=True):
            df_overview = df_overview[df_overview[RATING_FIELD] >= MINIMUM_RATING]

        if not st.sidebar.checkbox("Show hidden games?", value=False):
            df_overview = df_overview[~df_overview[HIDE_FIELD]]

        # Button to save the DataFrame to disk
        # if st.button('Save to Disk'):
        #    save_changes()

        df_overview[CUSTOM_RATING] = (
            df_overview[RATING_FIELD] * df_overview[REVIEW_SCORE_FIELD] / 9
        )
        # sort columns
        df_overview.insert(0, game_name, df_overview.pop(game_name))
        df_overview.insert(1, RATING_FIELD, df_overview.pop(RATING_FIELD))
        df_overview.insert(2, REVIEW_SCORE_FIELD, df_overview.pop(REVIEW_SCORE_FIELD))
        df_overview.insert(3, CUSTOM_RATING, df_overview.pop(CUSTOM_RATING))

        all_columns = df_overview.columns.tolist()
        if False:
            st.sidebar.write("### Select the columns to display:")
            columns_to_show = []
            column_choices = {
                col: st.sidebar.checkbox(col, col not in columns_off_by_default)
                for col in all_columns
            }

            for col, show in column_choices.items():
                if show:
                    columns_to_show.append(col)
        else:
            columns_to_show = overview_columns

        # Fetch unique stores for selection
        store_list = df_overview["store"].unique()

        # Multi-select sidebar option
        selected_stores = st.sidebar.multiselect(
            "Select Stores:", store_list, default=store_list
        )
        df_overview = df_overview[df_overview["store"].isin(selected_stores)]

        st.write(
            f"Number of games: {len(df_overview)}. Hidden: {st.session_state.df[HIDE_FIELD].sum()}"
        )

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

        edited_df = st.data_editor(
            df_overview[columns_to_show],
            column_config=column_config,
            hide_index=True,
            disabled=[s for s in all_columns if s not in [played_flag, HIDE_FIELD]],
            height=min(max(df_overview.shape[0] * 30, 30), 3000),
        )

        # save_changes(st.session_state.raw_df, edited_df)

    # Display the graph in the second tab
    with tab_rating_distribution:
        # Define the bins (excluding 0, as this will be a separate category)
        bins = np.linspace(0.01, 1, 11)  # Starts slightly above 0 to exclude 0
        # Create labels for the bins
        labels = [
            f"{round(bins[i], 2)}-{round(bins[i + 1], 2)}" for i in range(len(bins) - 1)
        ]
        labels.insert(0, "0")  # Insert labels for 0 ratings

        st.session_state.df_graph["binned"] = pd.cut(
            st.session_state.df_graph[RATING_FIELD],
            bins=[0] + list(bins),
            right=False,
            labels=labels,
        )

        ratings_count = st.session_state.df_graph["binned"].value_counts().sort_index()

        # Create a bar plot
        plt.figure(figsize=(12, 6))
        plt.bar(ratings_count.index, ratings_count.values, color="skyblue")
        plt.xlabel("Rating Range")
        plt.ylabel("Number of Ratings")
        plt.title("Rating Distribution")
        plt.xticks(rotation=45)
        plt.grid(True)
        st.pyplot(plt)

    with tab_correcting_app_id:
        mask = (df[game_name] != df[found_game_name]) | (df[APP_ID] == 0)
        df = df[mask]

        columns_to_show = [
            game_name,
            found_game_name,
            APP_ID,
            CORRECTED_APP_ID,
            URL,
            played_flag,
            HIDE_FIELD,
        ]

        st.write(f"Number of games: {len(df)}.")

        column_config = {
            URL: st.column_config.LinkColumn(
                URL,
                max_chars=100,
                display_text="https://store\.steampowered\.com/app/([0-9]*)",  # noqa: W605
                disabled=True,
            ),
            game_name: st.column_config.TextColumn(game_name, width="large"),
        }

        df = df.sort_values(by=game_name, ascending=False)

        edited_df = st.data_editor(
            df[columns_to_show],
            column_config=column_config,
            hide_index=True,
            disabled=[
                s
                for s in all_columns
                if s not in [played_flag, HIDE_FIELD, CORRECTED_APP_ID]
            ],
            height=min(max(df.shape[0] * 30, 30), 3000),
        )
        edited_df
        # save_changes(st.session_state.raw_df, edited_df)


if "df" not in st.session_state:
    st.session_state.df = load_data()
    st.session_state.df_graph = st.session_state.df.copy(deep=True)
    st.session_state.raw_df = st.session_state.df.copy(deep=True)

st.set_page_config(
    page_title=None,
    page_icon=None,
    layout="wide",
    initial_sidebar_state="auto",
    menu_items=None,
)
st.title("User Ratings Data")
display_dataframe()
