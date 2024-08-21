import numpy as np
import pandas as pd
import streamlit as st
from matplotlib import pyplot as plt

from src.constants import (
    CUSTOM_RATING,
    HIDE_FIELD,
    MINIMUM_RATING,
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    URL,
    found_game_name,
    game_name,
    played_flag,
)
from src.main import save_data
from src.utils import load_data

feature_editable = False

# Define columns that should be deactivated by default
columns_off_by_default = [
    "num_reviews",
    "review_score_desc",
    "total_positive",
    "total_negative",
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    "total_reviews",
]

editable_columns = [played_flag]


def save_changes(df, edited_df):
    # FIXME: This is hardcore frustrating, toggling filters in the sidebar resets these values - I seemingly misunderstand state
    # Merge raw and edited DataFrames based on 'name'

    for field_to_compare in [HIDE_FIELD, played_flag]:
        merged_df = pd.merge(df, edited_df, on=game_name, suffixes=("_raw", "_edited"))
        mask = (
            merged_df[f"{field_to_compare}_raw"]
            != merged_df[f"{field_to_compare}_edited"]
        )
        updates_dict = pd.Series(
            merged_df.loc[mask, f"{field_to_compare}_edited"].values,
            index=merged_df.loc[mask, game_name],
        ).to_dict()
        for name, new_hide in updates_dict.items():
            df.loc[df[game_name] == name, field_to_compare] = new_hide

    # drop exact duplicates
    df = df.drop_duplicates()
    st.session_state.df = df
    save_data(st.session_state.df.copy(deep=True))


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe():
    df = st.session_state.df.copy(deep=False)
    tab1, tab2 = st.tabs(["Dataframe", "Rating Distribution"])
    with tab1:

        st.sidebar.write("### Filter rows:")
        if st.sidebar.checkbox("Show Rows with Differences"):
            # Display rows where selected columns have different values
            mask = df[game_name] != df[found_game_name]
            df = df[mask]

        if st.sidebar.checkbox("Only not-played games?"):
            # Display rows where selected columns have different values
            mask = df[played_flag] == False  # noqa: E712
            df = df[mask]

        if st.sidebar.checkbox("Only rated games?", value=True):
            # Display rows where selected columns have different values
            mask = df["total_reviews"] != -1
            df = df[mask]

        if st.sidebar.checkbox("Hide 'bad' games?", value=True):
            df = df[df[RATING_FIELD] >= MINIMUM_RATING]

        if not st.sidebar.checkbox("Show hidden games?", value=False):
            print("hiding")
            df = df[~df[HIDE_FIELD]]

        # Button to save the DataFrame to disk
        # if st.button('Save to Disk'):
        #    save_changes()

        df[CUSTOM_RATING] = df[RATING_FIELD] * df[REVIEW_SCORE_FIELD] / 9
        # sort columns
        df.insert(0, game_name, df.pop(game_name))
        df.insert(1, CUSTOM_RATING, df.pop(CUSTOM_RATING))

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

        # Fetch unique stores for selection
        store_list = df["store"].unique()

        # Multi-select sidebar option
        selected_stores = st.sidebar.multiselect(
            "Select Stores:", store_list, default=store_list
        )
        df = df[df["store"].isin(selected_stores)]

        st.write(
            f"Number of games: {len(df)}. Hidden: {st.session_state.df[HIDE_FIELD].sum()}"
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

        df = df.sort_values(by=CUSTOM_RATING, ascending=False)

        edited_df = st.data_editor(
            df[columns_to_show],
            column_config=column_config,
            hide_index=True,
            disabled=[s for s in all_columns if s not in [played_flag, HIDE_FIELD]],
            height=len(df) * 30,
        )

        save_changes(st.session_state.raw_df, edited_df)

    # Display the graph in the second tab
    with tab2:
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
