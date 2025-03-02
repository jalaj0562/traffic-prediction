// Initialize map centered on Bangalore
let map = L.map('map').setView([12.9716, 77.5946], 12);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store active routes and markers
let activeRoutes = [];
let markers = [];

// DOM Elements
const routeForm = document.getElementById('route-form');
const routesList = document.getElementById('routes-list');
const trafficConditions = document.getElementById('traffic-conditions');
const errorMessage = document.getElementById('error-message');
const currentTimeEl = document.getElementById('current-time');
const weatherInfoEl = document.getElementById('weather-info');

// Update current time
function updateTime() {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    console.error('Error:', message);
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

/**
 * Clear existing routes from map
 */
function clearRoutes() {
    activeRoutes.forEach(route => map.removeLayer(route));
    activeRoutes = [];
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

/**
 * Create a route polyline with color based on congestion
 * @param {Array} coordinates - Array of [lat, lng] coordinates
 * @param {string} congestionLevel - Traffic congestion level
 * @returns {L.Polyline} Leaflet polyline object
 */
function createRouteLine(coordinates, congestionLevel) {
    const colors = {
        'LOW': '#27ae60',
        'MODERATE': '#f39c12',
        'HIGH': '#e74c3c',
        'SEVERE': '#c0392b'
    };

    return L.polyline(coordinates, {
        color: colors[congestionLevel] || colors.MODERATE,
        weight: 5,
        opacity: 0.7
    });
}

/**
 * Display route information in sidebar
 * @param {Object} route - Route information object
 */
function displayRouteInfo(route) {
    const routeElement = document.createElement('div');
    routeElement.className = `route-item ${route.recommendation.includes('RECOMMENDED') ? 'recommended' : ''}`;
    
    routeElement.innerHTML = `
        <h3>${route.name}</h3>
        <div class="route-details">
            <p><strong>Distance:</strong> ${route.distance.toFixed(1)} km</p>
            <p><strong>Est. Time:</strong> ${route.estimatedDuration} mins</p>
            <p><strong>Traffic:</strong> 
                <span class="congestion-${route.congestionLevel.toLowerCase()}">
                    ${route.congestionLevel}
                </span>
            </p>
            <p><strong>${route.recommendation}</strong></p>
        </div>
    `;

    routeElement.addEventListener('click', () => {
        // Highlight selected route
        document.querySelectorAll('.route-item').forEach(item => 
            item.classList.remove('selected'));
        routeElement.classList.add('selected');
    });

    routesList.appendChild(routeElement);
}

/**
 * Update traffic conditions panel
 * @param {Object} trafficData - Current traffic conditions
 */
function updateTrafficConditions(trafficData) {
    console.log('Updating traffic conditions with:', trafficData);
    trafficConditions.innerHTML = '';
    
    trafficData.segments.forEach(segment => {
        const segmentElement = document.createElement('div');
        segmentElement.className = 'traffic-item';
        
        segmentElement.innerHTML = `
            <h4>${segment.name}</h4>
            <p><strong>Current Speed:</strong> ${segment.currentSpeed} km/h</p>
            <p><strong>Congestion:</strong> 
                <span class="congestion-${segment.level.toLowerCase()}">
                    ${segment.level} (${segment.congestionPercent}%)
                </span>
            </p>
        `;
        
        trafficConditions.appendChild(segmentElement);
    });

    // Update weather information
    weatherInfoEl.textContent = `Weather: ${trafficData.weather}`;
}

/**
 * Fetch traffic data from API
 * @returns {Promise<Object>} Traffic data
 */
async function getTrafficData() {
    try {
        console.log('Fetching traffic data...');
        const response = await fetch('http://localhost:3000/api/traffic');
        if (!response.ok) {
            console.error('Traffic data response not OK:', response.status, response.statusText);
            throw new Error('Failed to fetch traffic data');
        }
        const data = await response.json();
        console.log('Traffic data received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching traffic data:', error);
        showError('Unable to fetch traffic conditions');
        throw error;
    }
}

/**
 * Fetch route recommendations from API
 * @param {string} origin - Starting point
 * @param {string} destination - End point
 * @returns {Promise<Array>} Array of route recommendations
 */
async function getRouteRecommendations(origin, destination) {
    try {
        console.log('Fetching routes for:', { origin, destination });
        const response = await fetch(
            `http://localhost:3000/api/routes?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
        );
        if (!response.ok) {
            console.error('Routes response not OK:', response.status, response.statusText);
            throw new Error('Failed to fetch routes');
        }
        const data = await response.json();
        console.log('Routes received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching routes:', error);
        showError('Unable to fetch route recommendations');
        throw error;
    }
}

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        console.log('Initializing application...');
        // Get initial traffic conditions
        const trafficData = await getTrafficData();
        updateTrafficConditions(trafficData);

        // Set up periodic updates
        setInterval(async () => {
            console.log('Updating traffic conditions...');
            const updatedTraffic = await getTrafficData();
            updateTrafficConditions(updatedTraffic);
        }, 60000); // Update every minute
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to initialize application');
    }
}

// Form submission handler
routeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    
    try {
        console.log('Form submitted with:', { origin, destination });
        // Clear previous routes
        clearRoutes();
        routesList.innerHTML = '';
        
        // Get route recommendations
        const routes = await getRouteRecommendations(origin, destination);
        
        // Add origin and destination markers
        const originCoords = routes[0].coordinates[0];
        const destCoords = routes[0].coordinates[1];
        
        const originMarker = L.marker(originCoords).addTo(map);
        const destMarker = L.marker(destCoords).addTo(map);
        markers.push(originMarker, destMarker);
        
        // Display each route
        routes.forEach(route => {
            const routeLine = createRouteLine(route.coordinates, route.congestionLevel);
            routeLine.addTo(map);
            activeRoutes.push(routeLine);
            
            displayRouteInfo(route);
        });
        
        // Fit map to show all routes
        const bounds = L.latLngBounds([...markers.map(m => m.getLatLng())]);
        map.fitBounds(bounds, { padding: [50, 50] });
        
    } catch (error) {
        console.error('Error processing form submission:', error);
        showError('Failed to calculate routes. Please try again.');
    }
});

// Initialize the application
initializeApp();
