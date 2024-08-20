import numpy as np
import pandas as pd
import streamlit as st
from matplotlib import pyplot as plt

from src.constants import (
    MINIMUM_RATING,
    RATING_FIELD,
    app_id,
    found_game_name,
    game_name,
    played_flag, REVIEW_SCORE_FIELD, CUSTOM_RATING,
)

from src.utils import load_data

# Define columns that should be deactivated by default
columns_off_by_default = [
    "num_reviews",
    "review_score_desc",
    "total_positive",
    "total_negative",
    RATING_FIELD,
    REVIEW_SCORE_FIELD,
    "total_reviews"
]

editable_columns = [played_flag]


def save_changes(edits: pd.DataFrame):
    print("changes detected")
    print(edits.head())


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe(df):
    # Setting 'name' column to type string
    df[game_name] = df[game_name].astype(str)

    df_raw = df.copy(deep=True)

    # Use tabs for multiple views
    tab1, tab2 = st.tabs(['Dataframe', 'Rating Distribution'])

    # Display the dataframe in the first tab
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

        if st.sidebar.checkbox("Only rated games?"):
            # Display rows where selected columns have different values
            mask = df["total_reviews"] != -1
            df = df[mask]

        if st.sidebar.checkbox("Hide 'bad' games?", value=True):
            df = df[df[RATING_FIELD] >= MINIMUM_RATING]

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
        selected_stores = st.sidebar.multiselect('Select Stores:', store_list, default=store_list)
        df = df[df['store'].isin(selected_stores)]

        st.write(f"Number of games: {len(df)}.")

        column_config = {
            app_id: st.column_config.LinkColumn(
                app_id,
                max_chars=100,
                display_text="https://store\.steampowered\.com/app/([0-9]*)",  # noqa: W605
                disabled=True
            ),
        }

        edited_df = st.data_editor(
            df[columns_to_show],
            column_config=column_config,
            hide_index=True,
            disabled=[s for s in all_columns if s != played_flag],
        )

        if edited_df is not None:
            save_changes(edited_df)

    # Display the graph in the second tab
    with tab2:
        # Define the bins (excluding 0, as this will be a separate category)
        bins = np.linspace(0.01, 1, 11)  # Starts slightly above 0 to exclude 0
        # Create labels for the bins
        labels = [f'{round(bins[i], 2)}-{round(bins[i + 1], 2)}' for i in range(len(bins) - 1)]
        labels.insert(0, '0')  # Insert labels for 0 ratings

        # Bin data, with a specific category for zero
        df_raw['binned'] = pd.cut(df_raw[RATING_FIELD], bins=[0] + list(bins), right=False, labels=labels)

        # Count the ratings in each bin/category
        ratings_count = df_raw['binned'].value_counts().sort_index()

        # Create a bar plot
        plt.figure(figsize=(12, 6))
        plt.bar(ratings_count.index, ratings_count.values, color='skyblue')
        plt.xlabel('Rating Range')
        plt.ylabel('Number of Ratings')
        plt.title('Rating Distribution')
        plt.xticks(rotation=45)
        plt.grid(True)
        # Display the plot
        st.pyplot(plt)

    st.session_state.df = df


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
