import pandas as pd

# Load the parquet file
df = pd.read_parquet('../../data/data.parquet')

# Sample 5 random rows
sample_df = df.sample(n=5)

# Write to new parquet file
sample_df.to_parquet('../../data/test_sample.parquet', index=False)

print(f"Sampled {len(sample_df)} rows from {len(df)} total rows")