/**
 * Routes Module for Bangalore Traffic System
 * Calculates and recommends routes between locations
 */

const trafficPrediction = require('./trafficPrediction');

/**
 * Generate intermediate points between two coordinates to create curved routes
 * @param {Object} start - Starting coordinates {lat, lng}
 * @param {Object} end - Ending coordinates {lat, lng}
 * @param {string} position - Position in the route ('start', 'middle', or 'end')
 * @returns {Array} Array of [lat, lng] coordinates
 */
function generateIntermediatePoints(start, end, position) {
    const points = [];
    const numPoints = 4; // Number of intermediate points
    
    // Calculate the midpoint
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    
    // Calculate perpendicular offset for curve
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust curve based on position in route
    let curveIntensity;
    switch(position) {
        case 'start':
            curveIntensity = 0.1; // Gentle curve at start
            break;
        case 'end':
            curveIntensity = 0.1; // Gentle curve at end
            break;
        default:
            curveIntensity = 0.2; // Stronger curve in middle
    }
    
    // Calculate control point offset
    const offsetLat = -dy * curveIntensity;
    const offsetLng = dx * curveIntensity;
    
    // Control point for quadratic curve
    const ctrlLat = midLat + offsetLat;
    const ctrlLng = midLng + offsetLng;
    
    // Generate points along the quadratic curve
    for (let i = 1; i < numPoints; i++) {
        const t = i / numPoints;
        const lat = Math.pow(1-t, 2) * start.lat + 
                   2 * (1-t) * t * ctrlLat + 
                   Math.pow(t, 2) * end.lat;
        const lng = Math.pow(1-t, 2) * start.lng + 
                   2 * (1-t) * t * ctrlLng + 
                   Math.pow(t, 2) * end.lng;
        points.push([lat, lng]);
    }
    
    return points;
}

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
    'majestic': { lat: 12.9766, lng: 77.5713 },
    'airport': { lat: 13.1989, lng: 77.7068 }
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
            segment.name.toLowerCase().includes(routeSegment.toLowerCase())
        )
    );

    // Calculate average congestion based on current speeds vs base speeds
    let avgCongestion = 1; // Default to no congestion
    
    if (affectedSegments.length > 0) {
        const congestionFactors = affectedSegments.map(segment => {
            const speedRatio = segment.currentSpeed / segment.baseSpeed;
            return speedRatio > 1 ? 1 : 1 / speedRatio; // Invert ratio if traffic is faster than base
        });
        
        avgCongestion = congestionFactors.reduce((acc, factor) => acc + factor, 0) / congestionFactors.length;
    }

    // Ensure minimum congestion factor of 1 (no faster than base duration)
    avgCongestion = Math.max(1, avgCongestion);

    // Adjust duration based on actual congestion
    const estimatedDuration = Math.max(1, Math.round(route.baseDuration * avgCongestion));

    // Determine congestion level for the entire route
    let congestionLevel;
    if (avgCongestion <= 1.15) congestionLevel = 'LOW';
    else if (avgCongestion <= 1.4) congestionLevel = 'MODERATE';
    else if (avgCongestion <= 1.8) congestionLevel = 'HIGH';
    else congestionLevel = 'SEVERE';

    return {
        ...route,
        estimatedDuration,
        congestionLevel,
        avgCongestion
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

    // Generate waypoints for different routes
    const getWaypoints = (route, destination) => {
        if (destination.toLowerCase() === 'airport') {
            switch(route) {
                case 'orr':
                    return {
                        points: ['hebbal'],
                        description: 'via Outer Ring Road through Hebbal'
                    };
                case 'central':
                    return {
                        points: ['majestic', 'hebbal'],
                        description: 'via City Center through Majestic and Hebbal'
                    };
                case 'peripheral':
                    return {
                        points: ['marathahalli', 'hebbal'],
                        description: 'via Peripheral Route through Marathahalli and Hebbal'
                    };
                default:
                    return {
                        points: [],
                        description: 'Direct Route'
                    };
            }
        } else {
            switch(route) {
                case 'orr':
                    return {
                        points: ['hebbal', 'marathahalli'],
                        description: 'via Outer Ring Road through Hebbal and Marathahalli'
                    };
                case 'central':
                    return {
                        points: ['majestic', 'indiranagar'],
                        description: 'via City Center through Majestic and Indiranagar'
                    };
                case 'peripheral':
                    return {
                        points: ['whitefield', 'electronic-city'],
                        description: 'via Peripheral Route through Whitefield and Electronic City'
                    };
                default:
                    return {
                        points: [],
                        description: 'Direct Route'
                    };
            }
        }
    };

    // Generate route with waypoints and intermediate points for curves
    const createRouteWithWaypoints = (routeType, multiplier) => {
        const { points, description } = getWaypoints(routeType, destination);
        
        // Convert waypoints to coordinates
        const waypointCoords = points.map(point => locations[point]);
        
        // Generate route coordinates with intermediate points for curves
        let routeCoordinates = [];
        let prevPoint = originCoords;
        
        // Add origin
        routeCoordinates.push([originCoords.lat, originCoords.lng]);
        
        // Add intermediate points between each waypoint
        waypointCoords.forEach((waypoint, index) => {
            // Calculate intermediate points for smooth curves
            const intermediatePoints = generateIntermediatePoints(
                prevPoint,
                waypoint,
                index === 0 ? 'start' : 'middle'
            );
            routeCoordinates.push(...intermediatePoints);
            
            // Add the waypoint
            routeCoordinates.push([waypoint.lat, waypoint.lng]);
            prevPoint = waypoint;
        });
        
        // Add intermediate points to destination
        const finalIntermediatePoints = generateIntermediatePoints(
            prevPoint,
            destCoords,
            'end'
        );
        routeCoordinates.push(...finalIntermediatePoints);
        
        // Add destination
        routeCoordinates.push([destCoords.lat, destCoords.lng]);
        
        return {
            id: `route-${routeType}`,
            name: `Route ${description}`,
            distance: distance * multiplier,
            baseDuration: Math.round(distance * multiplier * 2),
            segments: [origin.toLowerCase(), ...points, destination.toLowerCase()],
            routeDescription: description,
            coordinates: routeCoordinates,
            trafficInfo: {
                originArea: { name: origin },
                destinationArea: { name: destination }
            }
        };
    };

    // Generate multiple route options with different paths
    return [
        createRouteWithWaypoints('orr', 0.9),
        createRouteWithWaypoints('central', 1.1),
        createRouteWithWaypoints('peripheral', 1.3)
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
    
    // Validate input
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }
    
    if (origin.toLowerCase() === destination.toLowerCase()) {
        throw new Error('Origin and destination cannot be the same');
    }
    
    if (!locations[origin.toLowerCase()] || !locations[destination.toLowerCase()]) {
        throw new Error('Invalid location specified');
    }
    
    // Get current traffic conditions
    const trafficData = await trafficPrediction.simulateTraffic();
    console.log('Current time period:', trafficData.timePeriod);
    
    // Generate base routes
    const routes = generateRoutes(origin, destination);
    
    // Enhance routes with traffic data
    const enhancedRoutes = routes.map(route => 
        calculateRouteMetrics(route, trafficData)
    );
    
    // Sort routes by estimated duration
    const sortedRoutes = enhancedRoutes.sort((a, b) => a.estimatedDuration - b.estimatedDuration);
    
    // Add recommendations based on relative performance
    const routesWithRecommendations = sortedRoutes.map((route, index) => {
        let recommendation;
        if (index === 0) {
            recommendation = 'RECOMMENDED - Fastest Route';
        } else if (route.congestionLevel === 'LOW') {
            recommendation = 'Good Alternative - Light Traffic';
        } else {
            recommendation = 'Backup Route - Higher Congestion';
        }
        
        return {
            ...route,
            recommendation
        };
    });

    console.log('Routes calculated:', routesWithRecommendations);
    return routesWithRecommendations;
}

module.exports = {
    getAlternateRoutes
};
