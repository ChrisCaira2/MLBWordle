from pymongo import MongoClient # type: ignore
import statsapi as mlb # type: ignore
import time

# Connect to MongoDB server
client = MongoClient('mongodb://localhost:27017/')

# Create or connect to the database
db = client['mlbwordle']

# Create or connect to the collection
game_ids_collection = db['game_ids']

def find_and_store_game_ids(start_year, end_year, collection_name):
    game_ids = []
    for year in range(start_year, end_year + 1):
        for month in range(4, 11):  # April to October
            start_date = f'{year}-{month:02d}-01'
            end_date = f'{year}-{month:02d}-28'
            try:
                schedule = mlb.schedule(start_date=start_date, end_date=end_date)
                game_ids.extend([game['game_id'] for game in schedule])
            except Exception as e:
                print(f"Error fetching schedule for {start_date} to {end_date}: {e}")
                time.sleep(1)  # Wait for a second before retrying

    # Upsert the game IDs in the database
    game_ids_collection.update_one(
        {'_id': collection_name},
        {'$set': {'game_ids': game_ids}},
        upsert=True
    )

    print(f"Data inserted/updated successfully for {collection_name}, total game IDs: {len(game_ids)}")

# Find and store GamePKs from 2021-2024 BEGINNER
# find_and_store_game_ids(2021, 2024, 'game_ids_2021_2024')

# # Find and store GamePKs from 2000-2024 INTERMEDIATE
# find_and_store_game_ids(2000, 2024, 'game_ids_2000_2024')

# Find and store GamePKs from 1990-2024 EXPERT
find_and_store_game_ids(1980, 2024, 'game_ids_1990_2024')