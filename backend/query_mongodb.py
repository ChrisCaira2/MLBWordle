from pymongo import MongoClient # type: ignore

# Connect to MongoDB server
client = MongoClient('mongodb://localhost:27017/')

# Connect to the database
db = client['mlbwordle']

# Connect to the collection
game_ids_collection = db['game_ids']

# Query the collection and print the data
stored_game_ids = game_ids_collection.find_one({'_id': 'game_ids'})
if stored_game_ids:
    print("Stored game IDs:", stored_game_ids['game_ids'])
else:
    print("No game IDs found in the database")
