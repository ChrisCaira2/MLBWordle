import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ThreeDot from './ThreeDot';
import { FaChartBar, FaInfoCircle } from 'react-icons/fa';

// Update the backendUrl to use the Heroku deployment URL
const backendUrl = 'http://127.0.0.1:5000';
// const backendUrl = 'https://mlbwordle-c34bb59379da.herokuapp.com';

function GuessDate() {
    const [gameData, setGameData] = useState(null);
    const [error, setError] = useState(null);
    const [gameIds, setGameIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [guesses, setGuesses] = useState([]);
    const [guess, setGuess] = useState({ month: '', day: '', year: '' });
    const [gameDate, setGameDate] = useState(null);
    const [message, setMessage] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState({
        wins: 0,
        losses: 0,
        streak: 0,
        totalGuesses: 0,
        gamesPlayed: 0,
        guessesPerWin: []
    });
    const [activeMode, setActiveMode] = useState('Beginner');
    const bottomRef = useRef(null);
    const infoRef = useRef(null);
    const statsRef = useRef(null);

    useEffect(() => {
        const fetchGameIds = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/game-ids`);
                if (!response.ok) {
                    throw new Error('Failed to fetch game Ids');
                }
                const data = await response.json();
                setGameIds(data);
            } catch (err) {
                console.error('Error fetching game IDs:', err);
                setError('Failed to fetch game IDs');
            }
        };

        fetchGameIds();
    }, []);

    const fetchRandomGame = async () => {
        setLoading(true); // Set loading state before the fetch operation

        try {
            const response = await fetch(`${backendUrl}/api/random-game?mode=${activeMode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch random game boxscore');
            }
            const data = await response.json();
            setGameData(data.boxscore);

            const date = data.boxscore.split('\n').slice(0, -2)[data.boxscore.split('\n').slice(0, -2).length - 1];
            if (date) {
                const dateObj = new Date(date);
                const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
                setGameDate(formattedDate);
                // console.log('Game Date:', formattedDate);
            } else {
                setGameDate(null);
            }

            setGuesses([]); // Reset guesses
            setGuess({ month: '', day: '', year: '' }); // Clear text boxes
            setMessage(''); // Clear message
            setError(null);
        } catch (err) {
            console.error('Error fetching game data:', err);
            setError('Fetching Game Data, Try Again.');
        } finally {
            setLoading(false); // Reset loading state after the fetch operation
        }
    };

    const handleGuessChange = (e) => {
        const { name, value } = e.target;
        setGuess((prevGuess) => ({ ...prevGuess, [name]: value }));
    };

    const handleGuessSubmit = (e) => {
        e.preventDefault();
        if (guesses.length >= 5) {
            updateStats(false);
            return;
        }

        const newGuess = `${guess.month}-${guess.day}-${guess.year}`;
        setGuesses((prevGuesses) => [...prevGuesses, newGuess]);

        if (newGuess === gameDate) {
            setMessage('Congratulations! You guessed the correct date!');
            updateStats(true);
        } else if (guesses.length === 4) {
            setMessage(`Sorry, you've used all your tries. The correct date was ${gameDate}.`);
            updateStats(false);
        }

        // Scroll to the bottom
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [guesses]);

    const getFeedback = (guessPart, actualPart, isDay = false) => {
        if (guessPart === actualPart) return 'correct';
        if (isDay) {
            const diff = Math.abs(guessPart - actualPart);
            if (diff <= 2) return 'very-close';
            if (diff <= 7) return 'close';
        }
        if (Math.abs(guessPart - actualPart) === 1) return 'close';
        return 'incorrect';
    };

    const handleInfoClick = () => {
        setShowInfo(true);
    };

    const handleStatsClick = () => {
        setShowStats(true);
    };

    const handleCloseInfo = () => {
        setShowInfo(false);
    };

    const handleCloseStats = () => {
        setShowStats(false);
    };

    const handleClickOutside = (event) => {
        if (infoRef.current && !infoRef.current.contains(event.target)) {
            setShowInfo(false);
        }
        if (statsRef.current && !statsRef.current.contains(event.target)) {
            setShowStats(false);
        }
    };

    useEffect(() => {
        if (showInfo || showStats) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showInfo, showStats]);

    const updateStats = (isWin) => {
        setStats((prevStats) => {
            const newStats = { ...prevStats };
            newStats.gamesPlayed += 1;
            newStats.totalGuesses += guesses.length + 1;
            if (isWin) {
                newStats.wins += 1;
                newStats.streak += 1;
                newStats.guessesPerWin.push(guesses.length + 1);
            } else {
                newStats.losses += 1;
                newStats.streak = 0;
            }
            return newStats;
        });
    };

    const statsData = [
        { label: 'Wins', value: stats.wins },
        { label: 'Losses', value: stats.losses },
        { label: 'Streak', value: stats.streak },
        { label: 'Avg Guesses/Win', value: stats.wins > 0 ? (stats.totalGuesses / stats.wins).toFixed(2) : 0 }
    ];

    const handleModeChange = (mode) => {
        setActiveMode(mode);
        setGameData(null); // Clear the displayed box score
        setGameDate(null); // Clear the game date
        setGuesses([]); // Clear guesses
        setMessage(''); // Clear message
    };

    return (
        <div>
            <h1>MLB Wordle</h1>
            <div className="mode-buttons">
                <div>
                    <button className={`mode-button ${activeMode === 'Beginner' ? 'active' : ''}`} onClick={() => handleModeChange('Beginner')}>Beginner</button>
                    <div className="mode-text">(2020-2024)</div>
                </div>
                <div>
                    <button className={`mode-button ${activeMode === 'Intermediate' ? 'active' : ''}`} onClick={() => handleModeChange('Intermediate')}>Intermediate</button>
                    <div className="mode-text">(2000-2024)</div>
                </div>
                <div>
                    <button className={`mode-button ${activeMode === 'Expert' ? 'active' : ''}`} onClick={() => handleModeChange('Expert')}>Expert</button>
                    <div className="mode-text">(1980-2024)</div>
                </div>
            </div>
            <div className="icons">
                <FaChartBar className="icon" onClick={handleStatsClick} />
                <FaInfoCircle className="icon" onClick={handleInfoClick} />
            </div>
            <button onClick={fetchRandomGame} className="search-button">Find Random Game</button>
            <br></br>
            {loading && <ThreeDot variant="pulsate" color="#e28b3b" size="small" text="" textColor="" />}
            {error && <p className="error">{error}</p>}
            {gameData && (
                <>
                    <div className="game-box-score">
                        <pre>{gameData.split('\n').slice(0, -3).concat('**********').join('\n')}</pre>
                    </div>

                    <div className="guess-date-game">
                        <h2>Guess the Date</h2>
                        <form onSubmit={handleGuessSubmit} className="guess-form">
                            <div className="guess-inputs">
                                <input
                                    type="text"
                                    name="month"
                                    value={guess.month}
                                    onChange={handleGuessChange}
                                    placeholder="MM"
                                    maxLength="2"
                                    required
                                    autoComplete="off"
                                />
                                <input
                                    type="text"
                                    name="day"
                                    value={guess.day}
                                    onChange={handleGuessChange}
                                    placeholder="DD"
                                    maxLength="2"
                                    required
                                    autoComplete="off"
                                />
                                <input
                                    type="text"
                                    name="year"
                                    value={guess.year}
                                    onChange={handleGuessChange}
                                    placeholder="YYYY"
                                    maxLength="4"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <button type="submit" className="search-button">Submit Guess</button>
                        </form>
                        <div className="guesses">
                            {guesses.map((g, index) => {
                                const [month, day, year] = g.split('-');
                                const [actualMonth, actualDay, actualYear] = gameDate ? gameDate.split('-') : ['', '', ''];
                                return (
                                    <div key={index} className="guess">
                                        <span className={`guess-part ${getFeedback(month, actualMonth)}`}>{month}</span>
                                        <span className={`guess-part ${getFeedback(day, actualDay, true)}`}>{day}</span>
                                        <span className={`guess-part ${getFeedback(year, actualYear)}`}>{year}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {message && <p className="message">{message}</p>}
                        <div ref={bottomRef}></div>
                    </div>
                </>
            )}
            {showInfo && (
                <div className="info-popup" ref={infoRef}>
                    <div className="info-content">
                        <h2>How to Play</h2>
                        <ul>
                            <li>Click "Find Random Game" to get a random box score.</li>
                            <li>Choose between Beginner, Intermediate, and Expert difficulty</li>
                            <li>You have 5 tries to guess the date (MM-DD-YYYY).</li>
                            <li>Submit your guess and see if you are correct!</li>
                        </ul>
                        <div className="color-code-section">
                            <h3>Color Codes:</h3>
                            <ul>
                                <li><span className="color-box correct"></span> Correct</li>
                                <li><span className="color-box very-close"></span> Very Close (within 3 days)</li>
                                <li><span className="color-box close"></span> Close (within 7 days)</li>
                                <li><span className="color-box incorrect"></span> Incorrect</li>
                            </ul>
                        </div>
                        <button onClick={handleCloseInfo} className="close-button">Close</button>
                    </div>
                </div>
            )}
            {showStats && (
                <div className="stats-popup" ref={statsRef}>
                    <div className="stats-content">
                        <h2>Your Stats</h2>
                        <div className="bar-chart">
                            {statsData.map((data, index) => (
                                <div key={index} className="bar">
                                    <div className="bar-fill" style={{ height: `${data.value * 10}px` }}></div>
                                    <span className="bar-label">{data.label}</span>
                                    <span className="bar-value">{data.value}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleCloseStats} className="close-button">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuessDate;
