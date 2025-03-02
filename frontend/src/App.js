import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RandomGame from './randomGame';
import ThreeDot from './ThreeDot';
import GuessDate from './guessDate';

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [playerStats, setPlayerStats] = useState([]);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const suggestionsRef = useRef(null);
    const menuCheckboxRef = useRef(null);

    // Fetch suggestions as user types
    useEffect(() => {
        const getSuggestions = async () => {
            if (searchTerm.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                console.log('Fetching suggestions for:', searchTerm); // Debug log
                const response = await fetch(`http://localhost:5000/api/suggestions?query=${encodeURIComponent(searchTerm)}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch suggestions');
                }
                const data = await response.json();
                console.log('Received suggestions:', data); // Debug log
                setSuggestions(data);
                setShowSuggestions(true); // Explicitly show suggestions
            } catch (err) {
                console.error('Error fetching suggestions:', err);
                setSuggestions([]);
            }
        };

        const timeoutId = setTimeout(() => {
            getSuggestions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearch = async (playerName) => {
        setLoading(true); // Set loading state before the fetch operation
        try {
            console.log('Searching for player:', playerName); // Debug log
            const response = await fetch(`http://localhost:5000/api/player-stats?name=${encodeURIComponent(playerName)}`);
            if (!response.ok) {
                throw new Error('Player not found.');
            }
            const data = await response.json();
            console.log('Received player data:', data); // Debug log
            setPlayerStats((prevStats) => [...prevStats, data]);
            setError(null);
            setShowSuggestions(false);
            setSearchTerm('');
        } catch (err) {
            console.error('Search error:', err); // Debug log
            setError(err.message);
        } finally {
            setLoading(false); // Reset loading state after the fetch operation
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        console.log('Input changed to:', value); // Debug log
        setSearchTerm(value);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
    };

    const handleSuggestionClick = (suggestion) => {
        console.log('Suggestion clicked:', suggestion); // Debug log
        setSearchTerm(suggestion);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setActiveSuggestionIndex((prevIndex) => {
                const newIndex = Math.min(prevIndex + 1, suggestions.length - 1);
                scrollToSuggestion(newIndex);
                return newIndex;
            });
        } else if (e.key === 'ArrowUp') {
            setActiveSuggestionIndex((prevIndex) => {
                const newIndex = Math.max(prevIndex - 1, 0);
                scrollToSuggestion(newIndex);
                return newIndex;
            });
        } else if (e.key === 'Enter' && showSuggestions) {
            e.preventDefault();
            if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                setSearchTerm(suggestions[activeSuggestionIndex]);
                setShowSuggestions(false);
            }
        }
    };

    const scrollToSuggestion = (index) => {
        if (suggestionsRef.current) {
            const activeSuggestion = suggestionsRef.current.children[index];
            if (activeSuggestion) {
                activeSuggestion.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSearch(searchTerm);
    };

    const handleRemovePlayer = (index) => {
        setPlayerStats((prevStats) => prevStats.filter((_, i) => i !== index));
    };

    // Close suggestions when clicking outside
    const handleClickOutside = () => {
        setShowSuggestions(false);
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleMenuClick = () => {
        if (menuCheckboxRef.current) {
            menuCheckboxRef.current.checked = false;
        }
    };

    return (
        <Router>
            <div className="App">
                <nav className="navbar">
                    <div id="menuToggle">
                        <input type="checkbox" id="menuCheckbox" ref={menuCheckboxRef} />
                        <span></span>
                        <span></span>
                        <span></span>

                        <ul id="menu">
                            <li><Link to="/" onClick={handleMenuClick}>Player Stats</Link></li>
                            <li><Link to="/random-game" onClick={handleMenuClick}>Random Game</Link></li>
                            <li><Link to="/guess-date" onClick={handleMenuClick}>Guess Date</Link></li>
                        </ul>
                    </div>
                </nav>
                <Routes>
                    <Route exact path="/" element={
                        <>
                            <h1>MLB Player Stats</h1>
                            <form className="search-form" onSubmit={handleSubmit}>
                                <div className="search-container" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => setShowSuggestions(true)}
                                        placeholder="Search for a player..."
                                        className="search-input"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="suggestions-dropdown" ref={suggestionsRef}>
                                            {suggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                >
                                                    {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="search-button">Search</button>
                            </form>

                            {loading && <ThreeDot variant="pulsate" color="#e28b3b" size="small" text="" textColor="" />}

                            {error && <p className="error">{error}</p>}

                            {playerStats.length > 0 && (
                                <div className="stats-container">
                                    {playerStats.map((stats, index) => (
                                        <div key={index} className="player-stats">
                                            <button className="remove-button" onClick={() => handleRemovePlayer(index)}>X</button>
                                            <div className="player-header">
                                                <img src={stats.team_logo} alt={`${stats.team} logo`} className="team-logo" />
                                                <h2>{stats.name}</h2>
                                            </div>
                                            {stats.type === 'hitter' ? (
                                                <div className="stats">
                                                    <div className="stats-row">
                                                        <p>Batting Average: {stats.batting_avg}</p>
                                                        <p>On Base Percentage: {stats.obp}</p>
                                                        <p>Slugging Percentage: {stats.slg}</p>
                                                        <p>OPS: {stats.ops}</p>
                                                    </div>
                                                    <div className="stats-row">
                                                        <p>Games Played: {stats.games_played}</p>
                                                        <p>Doubles: {stats.doubles}</p>
                                                        <p>Triples: {stats.triples}</p>
                                                        <p>Home Runs: {stats.home_runs}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="stats">
                                                    <div className="stats-row">
                                                        <p>Games Started: {stats.games_started}</p>
                                                        <p>Innings Pitched: {stats.innings_pitched}</p>
                                                        <p>Wins: {stats.wins}</p>
                                                    </div>
                                                    <div className="stats-row">
                                                        <p>ERA: {stats.era}</p>
                                                        <p>WHIP: {stats.whip}</p>
                                                        <p>Strikeouts: {stats.strikeouts}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    } />
                    <Route path="/random-game" element={<RandomGame />} />
                    <Route path="/guess-date" element={<GuessDate />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;