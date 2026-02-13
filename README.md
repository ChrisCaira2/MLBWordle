# MLBWordle

A baseball-themed Wordle-style game where players guess MLB players based on their statistics.

## Project Structure

- **frontend/**: React application for the game interface
- **backend/**: Python Flask API and utilities
  - `mlb_stats.py`: Flask API for MLB player statistics
  - `setup_mongodb.py`: MongoDB initialization script
  - `query_mongodb.py`: Database query utilities
  - `scrape_beckett.py`: Beckett Baseball News xlsx scraper (NEW)

## Features

- Interactive MLB player guessing game
- Multiple difficulty modes (Beginner, Intermediate, Expert)
- Player statistics from MLB API
- MongoDB integration for game data

## New: Beckett XLSX Scraper

A new utility has been added to extract xlsx files from the Beckett Baseball News website. This tool can help gather baseball card checklist data.

### Quick Start

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run in demo mode (no internet required)
python scrape_beckett.py --demo --no-download

# See full usage instructions
python scrape_beckett.py --help
```

For detailed documentation, see [backend/SCRAPER_README.md](backend/SCRAPER_README.md)

## Setup

### Backend Setup

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Set up MongoDB (optional, for game data):
   ```bash
   python setup_mongodb.py
   ```

3. Run the Flask API:
   ```bash
   python mlb_stats.py
   ```

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Technologies Used

- **Frontend**: React, JavaScript
- **Backend**: Python, Flask, Flask-CORS
- **Database**: MongoDB
- **APIs**: MLB Stats API
- **Scraping**: Selenium, BeautifulSoup4, Requests

## License

See LICENSE file for details.
