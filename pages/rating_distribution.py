import numpy as np
import pandas as pd
import streamlit as st
from matplotlib import pyplot as plt

from backend.src.constants import RATING_FIELD
from backend.src.utils import load_data


# Create a function to display the DataFrame in Streamlit with filter and sorting options
def display_dataframe():
    # Define the bins (excluding 0, as this will be a separate category)
    bins = np.linspace(0.01, 1, 11)  # Starts slightly above 0 to exclude 0
    # Create labels for the bins
    labels = [f"{round(bins[i], 2)}-{round(bins[i + 1], 2)}" for i in range(len(bins) - 1)]
    labels.insert(0, "0")  # Insert labels for 0 ratings

    st.session_state.df_graph["binned"] = pd.cut(
        st.session_state.df_graph[RATING_FIELD],
        bins=[0] + list(bins),
        right=False,
        labels=labels,
    )

    ratings_count = st.session_state.df_graph["binned"].value_counts().sort_index()

    # Create a bar plot
    plt.figure(figsize=(10, 5))
    plt.bar(ratings_count.index, ratings_count.values, color="skyblue")
    plt.xlabel("Rating Range")
    plt.ylabel("Number of Ratings")
    plt.title("Rating Distribution")
    plt.xticks(rotation=45)
    plt.grid(True)
    st.pyplot(plt)


if "df_graph" not in st.session_state:
    st.session_state.df_graph = load_data()

st.set_page_config(
    page_title=None,
    page_icon=None,
    layout="wide",
    initial_sidebar_state="auto",
    menu_items=None,
)
display_dataframe()
