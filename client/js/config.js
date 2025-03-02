// Configuration settings for the application
const config = {
    // API configuration
    api: {
        // Base URL for API endpoints
        baseUrl: (() => {
            // Check if running on GitHub Pages
            if (window.location.hostname.includes('github.io')) {
                // Extract username and repository name from the URL
                const pathParts = window.location.pathname.split('/');
                const repoName = pathParts[1]; // First part after hostname is repo name
                return `https://${window.location.hostname}/${repoName}`;
            }
            // Local development
            return 'http://localhost:3000';
        })(),

        // API endpoints
        endpoints: {
            traffic: '/api/traffic',
            routes: '/api/routes'
        }
    },

    // Map configuration
    map: {
        center: [12.9716, 77.5946], // Bangalore coordinates
        defaultZoom: 12,
        minZoom: 10,
        maxZoom: 18
    },

    // Update intervals (in milliseconds)
    intervals: {
        trafficUpdate: 60000 // 1 minute
    }
};

// Export the configuration
export default config;
