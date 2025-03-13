import statsapi as mlb
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import random
import pymongo
from pymongo import MongoClient
import sys
import json
from datetime import datetime, timedelta

app = Flask(__name__)

# Enable CORS properly for all routes with more permissive settings
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:8100",
            "http://127.0.0.1:8100",
            "http://mlbwordle1-env.eba-9ccemmu4.us-east-2.elasticbeanstalk.com",
            "http://mlbwordle.s3-website-us-east-1.amazonaws.com"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600
    }
})

# Initialize MongoDB client and database
client = MongoClient('mongodb://localhost:27017/')
db = client['mlbwordle']
game_ids_collection = db['game_ids']
daily_game_collection = db['daily_game']

def get_game_ids(mode):
    if mode == 'Beginner':
        game_ids_data = game_ids_collection.find_one({'_id': 'game_ids_2021_2024'})
    elif mode == 'Intermediate':
        game_ids_data = game_ids_collection.find_one({'_id': 'game_ids_2000_2024'})
    elif mode == 'Expert':
        game_ids_data = game_ids_collection.find_one({'_id': 'game_ids_1990_2024'})
    else:
        return {'error': 'Invalid mode'}

    if not game_ids_data:
        return {'error': 'No game IDs found in the database'}

    return {'game_ids': game_ids_data['game_ids']}

def get_random_game_box_score(mode):
    game_ids_data = get_game_ids(mode)
    if 'error' in game_ids_data:
        return game_ids_data

    game_ids = game_ids_data['game_ids']
    random_game_id = random.choice(game_ids)
    boxscore = mlb.boxscore(random_game_id)
    return {'gamePK': random_game_id, 'boxscore': boxscore}

def get_daily_game():
    today = datetime.now().strftime('%Y-%m-%d')
    daily_game_data = daily_game_collection.find_one({'date': today})

    if daily_game_data:
        return daily_game_data

    modes = ['Beginner', 'Intermediate', 'Expert']
    mode = random.choice(modes)
    game_data = get_random_game_box_score(mode)
    game_data['date'] = today
    game_data['difficulty'] = mode

    daily_game_collection.update_one({'date': today}, {'$set': game_data}, upsert=True)
    return game_data

# Add a before_request handler to ensure CORS headers
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Vary'] = 'Origin'
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/player-stats', methods=['GET'])
def get_player_stats():
    player_name = request.args.get('name', '').strip()
    if not player_name:
        return jsonify({'error': 'Player name is required'}), 400

    try:
        search_results = mlb.lookup_player(player_name)
        if not search_results:
            return jsonify({'error': 'Player not found'}), 404

        player_id = search_results[0]['id']
        player_stats = mlb.player_stat_data(player_id, type='career')

        if player_stats is None:
            return jsonify({'error': 'Player stats not found'}), 404

        primary_position = search_results[0]['primaryPosition']['abbreviation']
        team_id = search_results[0].get('currentTeam', {}).get('id')
        team_logo = f"https://www.mlbstatic.com/team-logos/{team_id}.svg" if team_id else None
        if (primary_position in ['P', 'SP', 'RP']):
            for stat in player_stats['stats']:
                if stat['group'] == 'pitching':
                    result = {
                        'name': player_name,
                        'team': search_results[0].get('currentTeam', {}).get('name', 'Unknown'),
                        'team_logo': team_logo,
                        'type': 'pitcher',
                        'games_started': stat['stats'].get('gamesStarted', 0),
                        'innings_pitched': stat['stats'].get('inningsPitched', 0),
                        'wins': stat['stats'].get('wins', 0),
                        'era': stat['stats'].get('era', 'N/A'),
                        'whip': stat['stats'].get('whip', 'N/A'),
                        'strikeouts': stat['stats'].get('strikeOuts', 0)
                    }
                    return jsonify(result)
        else:
            for stat in player_stats['stats']:
                if stat['group'] == 'hitting':
                    result = {
                        'name': player_name,
                        'team': search_results[0].get('currentTeam', {}).get('name', 'Unknown'),
                        'team_logo': team_logo,
                        'type': 'hitter',
                        'games_played': stat['stats'].get('gamesPlayed', 0),
                        'batting_avg': stat['stats'].get('avg', 'N/A'),
                        'obp': stat['stats'].get('obp', 'N/A'),
                        'slg': stat['stats'].get('slg', 'N/A'),
                        'ops': stat['stats'].get('ops', 'N/A'),
                        'doubles': stat['stats'].get('doubles', 0),
                        'triples': stat['stats'].get('triples', 0),
                        'home_runs': stat['stats'].get('homeRuns', 0)
                    }
                    return jsonify(result)

        return jsonify({'error': 'Stats not found'}), 404
    except Exception as e:
        print(f"Error fetching player stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch player stats'}), 500

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    query = request.args.get('query', '').strip().lower()
    if not query:
        return jsonify([])

    try:
        search_results = mlb.lookup_player(query)
        suggestions = [player['fullName'] for player in search_results]
        return jsonify(suggestions[:10])
    except Exception as e:
        print(f"Error fetching suggestions: {str(e)}")
        return jsonify([])

@app.route('/api/game-ids', methods=['GET'])
def get_game_ids_route():
    try:
        mode = request.args.get('mode', 'Beginner')
        result = get_game_ids(mode)
        if 'error' in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching game IDs: {str(e)}")
        return jsonify({'error': 'Failed to fetch game IDs'}), 500

@app.route('/api/game-boxscore/<int:game_id>', methods=['GET'])
def get_game_boxscore(game_id):
    try:
        boxscore = mlb.boxscore(game_id)
        print(f"Fetched boxscore for game_id {game_id}: {boxscore}")
        return jsonify({'boxscore': boxscore})
    except Exception as e:
        print(f"Error fetching game boxscore for game_id {game_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch game boxscore'}), 500

# Initialize a set to track previously fetched game IDs
fetched_game_ids = set()

@app.route('/api/random-game', methods=['GET'])
def get_random_game():
    try:
        mode = request.args.get('mode', 'Beginner')
        result = get_random_game_box_score(mode)
        if 'error' in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching random game boxscore: {str(e)}")
        return jsonify({'error': 'Failed to fetch random game boxscore'}), 500

@app.route('/api/daily-game', methods=['GET'])
def get_daily_game_route():
    try:
        result = get_daily_game()
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching daily game: {str(e)}")
        return jsonify({'error': 'Failed to fetch daily game'}), 500

if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1]
        mode = sys.argv[2] if len(sys.argv) > 2 else 'Beginner'

        if command == 'game-ids':
            result = get_game_ids(mode)
        elif command == 'random-game':
            result = get_random_game_box_score(mode)
        elif command == 'daily-game':
            result = get_daily_game()
        else:
            result = {'error': 'Invalid command'}

        print(json.dumps(result))
    else:
        app.run(host='0.0.0.0', debug=True, port=5000)