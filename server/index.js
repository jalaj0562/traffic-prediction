const express = require('express');
const cors = require('cors');
const path = require('path');
const trafficPrediction = require('./trafficPrediction');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests from localhost and GitHub Pages
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000'
        ];
        
        // Add your GitHub Pages domain
        if (process.env.GITHUB_PAGES_URL) {
            allowedOrigins.push(process.env.GITHUB_PAGES_URL);
        }
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

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
