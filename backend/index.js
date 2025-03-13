const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API route to fetch game IDs
app.get('/api/game-ids', (req, res) => {
    const pythonProcess = spawn('python3', [path.join(__dirname, 'mlb_stats.py'), 'game-ids', req.query.mode]);

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
            res.status(500).send('Error fetching game IDs');
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        res.status(500).send('Error fetching game IDs');
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`python process exited with code ${code}`);
            res.status(500).send('Error fetching game IDs');
        }
    });
});

// API route to fetch a random game based on difficulty
app.get('/api/random-game', (req, res) => {
    const { mode } = req.query;
    const pythonProcess = spawn('python3', [path.join(__dirname, 'mlb_stats.py'), 'random-game', mode]);

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
