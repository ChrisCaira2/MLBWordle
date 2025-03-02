import React, { useState, useEffect } from 'react';
import './App.css';
import ThreeDot from './ThreeDot';
function RandomGame() {
    const [gameData, setGameData] = useState(null);
    const [error, setError] = useState(null);
    const [gameIds, setGameIds] = useState([]);
    const [loading, setLoading] = useState(false);
    // test
    useEffect(() => {
        const fetchGameIds = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/game-ids`);
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
            if (gameIds.length === 0) {
                throw new Error('No game IDs available');
            }
            const min = 0;
            const max = gameIds.length;
            const rando = Math.floor(Math.random() * (max - min) + min);
            const randomGameId = gameIds[rando];

            const boxscoreResponse = await fetch(`http://localhost:5000/api/game-boxscore/${randomGameId}`);
            if (!boxscoreResponse.ok) {
                throw new Error('Failed to fetch game boxscore');
            }
            const boxscoreData = await boxscoreResponse.json();
            setGameData(boxscoreData.boxscore);
            setError(null);
        } catch (err) {
            console.error('Error fetching game data:', err);
            setError('Fetching Game Data, Try Again.');
        } finally {
            setLoading(false); // Reset loading state after the fetch operation
        }
    };

    return (
        <div>
            <h1>Random MLB Game Box Score</h1>
            <button onClick={fetchRandomGame} className="search-button">Fetch Random Game</button>
            {loading && <ThreeDot variant="pulsate" color="#e28b3b" size="small" text="" textColor="" />}
            {error && <p className="error">{error}</p>}
            {gameData ? (
                <div className="game-box-score">
                    <pre>{gameData}</pre>
                </div>
            ) : (
                <p>Click the button to fetch a random game box score.</p>
            )}
        </div>
    );
}

export default RandomGame;
