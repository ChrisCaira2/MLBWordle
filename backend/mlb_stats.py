import statsapi as mlb
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import random

app = Flask(__name__)

# Enable CORS properly for all routes with more permissive settings
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:8100", "http://127.0.0.1:8100"],  # Add all your frontend URLs
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600
    }
})

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
        if primary_position in ['P', 'SP', 'RP']:
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
def get_game_ids():
    try:
        # Get a list of all games for the specified date range in smaller chunks
        game_ids = []
        for year in range(2020, 2025):
            for month in range(4, 11):  # April to October
                start_date = f'{year}-{month:02d}-01'
                end_date = f'{year}-{month:02d}-28'
                schedule = mlb.schedule(start_date=start_date, end_date=end_date)
                game_ids.extend([game['game_id'] for game in schedule])
        print(len(game_ids))
        if not game_ids:
            return jsonify({'error': 'No games found in the specified date range'}), 404

        return jsonify(game_ids)
    except Exception as e:
        print(f"Error fetching game IDs: {str(e)}")
        return jsonify({'error': 'Failed to fetch game IDs'}), 500

@app.route('/api/game-boxscore/<int:game_id>', methods=['GET'])
def get_game_boxscore(game_id):
    try:
        boxscore = mlb.boxscore(game_id)
        return jsonify({'boxscore': boxscore})
    except Exception as e:
        print(f"Error fetching game boxscore: {str(e)}")
        return jsonify({'error': 'Failed to fetch game boxscore'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)

def get_player_stats_by_name(name):
    search_results = mlb.lookup_player(name)
    if len(search_results) == 0:
        return None
    print(search_results[0])

def get_player_stats_by_name_and_team(name, team):
    search_results = mlb.lookup_player(name)
    if len(search_results) == 0:
        return None
    for player in search_results:
        if player['team']['abbreviation'] == team:
            return player
    return None

def get_player_stats_by_name_and_position(name, position):
    search_results = mlb.lookup_player(name)
    if len(search_results) == 0:
        return None
    for player in search_results:
        if player['primaryPosition']['abbreviation'] == position:
            return player
    return None

def get_player_stat_data(player_id):
    player = mlb.player_stat_data(player_id, type='career')
    if player is None:
        return None
    # Print player's home runs
    for stat in player['stats']:
        if stat['group'] == 'hitting':
            print(f"Home Runs: {stat['stats']['homeRuns']}")
            return stat['stats']['homeRuns']
    return None

# get_player_stats_by_name('Trout')
get_player_stat_data(545361)