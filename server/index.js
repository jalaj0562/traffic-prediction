const express = require('express');
const cors = require('cors');
const path = require('path');
const trafficPrediction = require('./trafficPrediction');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for development
app.use(express.json());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.get('/api/traffic', async (req, res) => {
    try {
        console.log('Received request for traffic data');
        const trafficData = await trafficPrediction.simulateTraffic();
        console.log('Traffic data generated:', trafficData);
        res.json(trafficData);
    } catch (error) {
        console.error('Error in /api/traffic:', error);
        res.status(500).json({ error: 'Failed to fetch traffic data', details: error.message });
    }
});

app.get('/api/routes', async (req, res) => {
    try {
        console.log('Received request for routes:', req.query);
        const { origin, destination } = req.query;
        
        if (!origin || !destination) {
            console.log('Missing required parameters');
            return res.status(400).json({ 
                error: 'Origin and destination are required' 
            });
        }

        const alternateRoutes = await routes.getAlternateRoutes(origin, destination);
        console.log('Routes calculated:', alternateRoutes);
        res.json(alternateRoutes);
    } catch (error) {
        console.error('Error in /api/routes:', error);
        res.status(500).json({ 
            error: 'Failed to calculate alternate routes',
            details: error.message
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong! Please try again later.',
        details: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
