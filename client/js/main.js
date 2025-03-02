// Import configuration
import config from './config.js';

// Theme management
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
let isDarkTheme = localStorage.getItem('theme') === 'dark';

// Initialize theme
function initializeTheme() {
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.textContent = '🌞';
    }
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    themeIcon.textContent = isDarkTheme ? '🌙' : '🌞';
});

// Initialize map centered on Bangalore with enhanced controls
let map = L.map('map', {
    center: config.map.center,
    zoom: config.map.defaultZoom,
    zoomControl: false, // We'll add zoom control on the right side
    minZoom: config.map.minZoom,
    maxZoom: config.map.maxZoom,
    doubleClickZoom: true,
    scrollWheelZoom: true,
    dragging: true,
    tap: true
}).setView(config.map.center, config.map.defaultZoom);

// Add zoom control to the right side
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Add scale control
L.control.scale({
    imperial: false,
    maxWidth: 200
}).addTo(map);

// Add OpenStreetMap tile layer with conditional styling
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    className: isDarkTheme ? 'dark-map' : '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);

// Add fullscreen control
L.control.fullscreen({
    position: 'topright',
    title: {
        'false': 'View Fullscreen',
        'true': 'Exit Fullscreen'
    }
}).addTo(map);

// Add locate control to help users find their location
L.control.locate({
    position: 'topright',
    strings: {
        title: 'Show my location'
    },
    locateOptions: {
        maxZoom: 16
    }
}).addTo(map);

// Add event listeners for better user interaction
map.on('zoomend', () => {
    // Adjust marker sizes based on zoom level
    const zoom = map.getZoom();
    markers.forEach(marker => {
        if (marker instanceof L.CircleMarker) {
            marker.setRadius(zoom > 14 ? 8 : 6);
        }
    });
});

// Add tooltips to markers for better identification
function addTooltipToMarker(marker, text) {
    marker.bindTooltip(text, {
        permanent: false,
        direction: 'top',
        className: 'marker-tooltip'
    });
}

// Initialize theme
initializeTheme();

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
function createRouteLine(coordinates, congestionLevel, routeType) {
    // Different colors for different route types
    const routeColors = {
        'orr': '#2ecc71',      // Green for Outer Ring Road route
        'central': '#3498db',  // Blue for Central route
        'peripheral': '#9b59b6' // Purple for Peripheral route
    };

    // Congestion modifies the opacity
    const congestionOpacity = {
        'LOW': 0.9,
        'MODERATE': 0.7,
        'HIGH': 0.5,
        'SEVERE': 0.3
    };

    // Create a curved polyline with smooth rendering
    const line = L.polyline(coordinates, {
        color: routeColors[routeType] || '#95a5a6',
        weight: 5,
        opacity: congestionOpacity[congestionLevel] || 0.7,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
    });

    // Add hover effect
    line.on('mouseover', function() {
        this.setStyle({
            weight: 8,
            opacity: 1
        });
    }).on('mouseout', function() {
        this.setStyle({
            weight: 5,
            opacity: congestionOpacity[congestionLevel] || 0.7
        });
    });

    // Add waypoint markers except for start and end points
    if (coordinates.length > 2) {
        coordinates.slice(1, -1).forEach((coord, index) => {
            const waypointMarker = L.circleMarker(coord, {
                radius: 6,
                fillColor: routeColors[routeType] || '#95a5a6',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });
            line.waypoints = line.waypoints || [];
            line.waypoints.push(waypointMarker);
        });
    }

    return line;
}

/**
 * Display route information in sidebar
 * @param {Object} route - Route information object
 */
function displayRouteInfo(route) {
    const routeElement = document.createElement('div');
    routeElement.className = `route-item ${route.recommendation.includes('RECOMMENDED') ? 'recommended' : ''}`;
    
    const routeColors = {
        'orr': '#2ecc71',
        'central': '#3498db',
        'peripheral': '#9b59b6'
    };
    
    const routeType = route.id.split('-')[1];
    const routeColor = routeColors[routeType] || '#95a5a6';
    
    routeElement.innerHTML = `
        <h3>
            <span class="route-color-indicator" style="background-color: ${routeColor}"></span>
            ${route.name}
        </h3>
        <div class="route-details">
            <p><strong>Via:</strong> ${route.routeDescription}</p>
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
// Get base API URL based on environment
const getApiBaseUrl = () => {
    // Check if running on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        // Return the GitHub Pages URL for your repository
        return `https://${window.location.hostname}`;
    }
    // Local development
    return 'http://localhost:3000';
};

async function getTrafficData() {
    try {
        console.log('Fetching traffic data...');
        const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.traffic}`);
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
            `${config.api.baseUrl}${config.api.endpoints.routes}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
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
        }, config.intervals.trafficUpdate);
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
        if (!origin || origin === 'Select starting point') {
            showError('Please select a starting point');
            return;
        }
        if (!destination || destination === 'Select destination') {
            showError('Please select a destination');
            return;
        }
        if (origin === destination) {
            showError('Origin and destination cannot be the same');
            return;
        }
        
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
            const routeType = route.id.split('-')[1];
            const routeLine = createRouteLine(route.coordinates, route.congestionLevel, routeType);
            routeLine.addTo(map);
            activeRoutes.push(routeLine);
            
            // Add waypoint markers if they exist
            if (routeLine.waypoints) {
                routeLine.waypoints.forEach(marker => {
                    marker.addTo(map);
                    markers.push(marker);
                });
            }
            
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
