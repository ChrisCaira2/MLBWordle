import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RandomGame from './randomGame';
import ThreeDot from './ThreeDot';
import GuessDate from './guessDate';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

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
                const response = await fetch(`${backendUrl}/api/suggestions?query=${encodeURIComponent(searchTerm)}`);
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
            const response = await fetch(`${backendUrl}/api/player-stats?name=${encodeURIComponent(playerName)}`);
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
                    {/* <div id="menuToggle">
                        <input type="checkbox" id="menuCheckbox" ref={menuCheckboxRef} />
                        <span></span>
                        <span></span>
                        <span></span>

                        <ul id="menu">
                            <li><Link to="/" onClick={handleMenuClick}>Player Stats</Link></li>
                            <li><Link to="/random-game" onClick={handleMenuClick}>Random Game</Link></li>
                            <li><Link to="/guess-date" onClick={handleMenuClick}>Guess Date</Link></li>
                        </ul>
                    </div> */}
                </nav>
                <Routes>
                    <Route exact path="/" element={<GuessDate />} />
                    {/* <Route path="/random-game" element={<RandomGame />} /> */}
                    <Route path="/guess-date" element={<GuessDate />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;