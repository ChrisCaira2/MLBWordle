const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const mongoUri = 'your_mongodb_connection_string';
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API route to fetch game IDs
app.get('/api/game-ids', async (req, res) => {
    const { mode } = req.query;
    try {
        await client.connect();
        const database = client.db('mlbwordle');
        const collection = database.collection('game_ids');
        let gameIdsData;

        if (mode === 'Beginner') {
            gameIdsData = await collection.findOne({ _id: 'game_ids_2021_2024' });
        } else if (mode === 'Intermediate') {
            gameIdsData = await collection.findOne({ _id: 'game_ids_2000_2024' });
        } else if (mode === 'Expert') {
            gameIdsData = await collection.findOne({ _id: 'game_ids_1990_2024' });
        } else {
            return res.status(400).json({ error: 'Invalid mode' });
        }

        if (!gameIdsData) {
            return res.status(404).json({ error: 'No game IDs found in the database' });
        }

        res.json({ gameIds: gameIdsData.game_ids });
    } catch (err) {
        console.error('Error fetching game IDs:', err);
        res.status(500).json({ error: 'Failed to fetch game IDs' });
    } finally {
        await client.close();
    }
});

// API route to fetch a random game based on difficulty
app.get('/api/random-game', (req, res) => {
    const { mode } = req.query;
    const pythonProcess = spawn('python', [path.join(__dirname, 'mlb_stats.py'), mode]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.status(500).send('Error fetching game data');
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        res.status(500).send('Error fetching game data');
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`python process exited with code ${code}`);
            res.status(500).send('Error fetching game data');
        }
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
