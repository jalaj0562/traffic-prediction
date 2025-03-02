/**
 * Routes Module for Bangalore Traffic System
 * Calculates and recommends routes between locations
 */

const trafficPrediction = require('./trafficPrediction');

// Predefined locations in Bangalore with coordinates
const locations = {
    'koramangala': { lat: 12.9279, lng: 77.6271 },
    'electronic-city': { lat: 12.8458, lng: 77.6692 },
    'whitefield': { lat: 12.9698, lng: 77.7499 },
    'indiranagar': { lat: 12.9784, lng: 77.6408 },
    'marathahalli': { lat: 12.9591, lng: 77.6974 },
    'bannerghatta': { lat: 12.8997, lng: 77.5968 },
    'hebbal': { lat: 13.0358, lng: 77.5970 },
    'jp-nagar': { lat: 12.9078, lng: 77.5929 },
    'majestic': { lat: 12.9766, lng: 77.5713 }
};

/**
 * Calculate route metrics based on traffic conditions
 * @param {Object} route - Basic route information
 * @param {Object} trafficData - Current traffic conditions
 * @returns {Object} Enhanced route with traffic-based metrics
 */
function calculateRouteMetrics(route, trafficData) {
    // Calculate congestion level based on affected segments
    const congestionLevels = {
        'LOW': 1,
        'MODERATE': 1.3,
        'HIGH': 1.6,
        'SEVERE': 2
    };

    // Find affected road segments for this route
    const affectedSegments = trafficData.segments.filter(segment => 
        route.segments.some(routeSegment => 
            segment.name.toLowerCase().includes(routeSegment)
        )
    );

    // Calculate average congestion
    const avgCongestion = affectedSegments.reduce((acc, segment) => {
        return acc + congestionLevels[segment.level];
    }, 0) / (affectedSegments.length || 1);

    // Adjust duration based on congestion
    const estimatedDuration = Math.round(route.baseDuration * avgCongestion);

    // Determine congestion level for the entire route
    let congestionLevel;
    if (avgCongestion <= 1.15) congestionLevel = 'LOW';
    else if (avgCongestion <= 1.4) congestionLevel = 'MODERATE';
    else if (avgCongestion <= 1.8) congestionLevel = 'HIGH';
    else congestionLevel = 'SEVERE';

    // Generate recommendation based on metrics
    let recommendation;
    if (estimatedDuration === Math.min(route.baseDuration * avgCongestion, route.baseDuration * 1.2)) {
        recommendation = 'RECOMMENDED - Fastest Route';
    } else if (congestionLevel === 'LOW') {
        recommendation = 'Good Alternative - Light Traffic';
    } else {
        recommendation = 'Backup Route - Higher Congestion';
    }

    return {
        ...route,
        estimatedDuration,
        congestionLevel,
        recommendation
    };
}

/**
 * Generate route options between two points
 * @param {string} origin - Starting location
 * @param {string} destination - Ending location
 * @returns {Array} Array of possible routes
 */
function generateRoutes(origin, destination) {
    const originCoords = locations[origin.toLowerCase()];
    const destCoords = locations[destination.toLowerCase()];

    if (!originCoords || !destCoords) {
        throw new Error('Invalid location specified');
    }

    // Calculate direct distance for base metrics
    const distance = Math.sqrt(
        Math.pow(destCoords.lat - originCoords.lat, 2) + 
        Math.pow(destCoords.lng - originCoords.lng, 2)
    ) * 111.32 * 1.2; // Convert to km and add 20% for road factor

    // Generate multiple route options
    return [
        {
            id: 'route1',
            name: 'Fastest Route via ORR',
            distance: distance * 0.9,
            baseDuration: Math.round(distance * 2),
            segments: [origin.toLowerCase(), destination.toLowerCase()],
            routeDescription: 'Via Outer Ring Road',
            coordinates: [
                [originCoords.lat, originCoords.lng],
                [destCoords.lat, destCoords.lng]
            ],
            trafficInfo: {
                originArea: { name: origin },
                destinationArea: { name: destination }
            }
        },
        {
            id: 'route2',
            name: 'Alternative Route 1',
            distance: distance * 1.1,
            baseDuration: Math.round(distance * 1.8),
            segments: [origin.toLowerCase(), destination.toLowerCase()],
            coordinates: [
                [originCoords.lat, originCoords.lng],
                [destCoords.lat, destCoords.lng]
            ],
            trafficInfo: {
                originArea: { name: origin },
                destinationArea: { name: destination }
            }
        },
        {
            id: 'route3',
            name: 'Alternative Route 2',
            distance: distance * 1.3,
            baseDuration: Math.round(distance * 1.9),
            segments: [origin.toLowerCase(), destination.toLowerCase()],
            coordinates: [
                [originCoords.lat, originCoords.lng],
                [destCoords.lat, destCoords.lng]
            ],
            trafficInfo: {
                originArea: { name: origin },
                destinationArea: { name: destination }
            }
        }
    ];
}

/**
 * Get alternate routes between two locations
 * @param {string} origin - Starting location
 * @param {string} destination - Ending location
 * @returns {Promise<Array>} Array of route recommendations
 */
async function getAlternateRoutes(origin, destination) {
    console.log('Calculating routes between:', origin, 'and', destination);
    
    // Get current traffic conditions
    const trafficData = await trafficPrediction.simulateTraffic();
    console.log('Current time period:', trafficData.timePeriod);
    
    // Generate base routes
    const routes = generateRoutes(origin, destination);
    
    // Enhance routes with traffic data
    const enhancedRoutes = routes.map(route => 
        calculateRouteMetrics(route, trafficData)
    );
    
    console.log('Routes calculated:', enhancedRoutes);
    return enhancedRoutes;
}

module.exports = {
    getAlternateRoutes
};
