/**
 * Traffic Prediction Module for Bangalore
 * Simulates real-time traffic conditions and predicts congestion levels
 */

// Predefined road segments for Bangalore
const roadSegments = [
    { id: 1, name: 'Outer Ring Road', baseSpeed: 60 },
    { id: 2, name: 'Silk Board Junction', baseSpeed: 30 },
    { id: 3, name: 'Old Airport Road', baseSpeed: 45 },
    { id: 4, name: 'Hosur Road', baseSpeed: 50 },
    { id: 5, name: 'Marathahalli Bridge', baseSpeed: 40 }
];

// Traffic factors that influence congestion
const trafficFactors = {
    timeOfDay: {
        'morning-rush': 1.8,    // 80% slower during morning rush (9AM-11AM)
        'evening-rush': 2.0,    // 100% slower during evening rush (5PM-8PM)
        'normal': 1.0,          // Normal conditions
        'night': 0.8            // 20% faster at night (11PM-5AM)
    },
    weather: {
        'clear': 1.0,
        'rain': 1.4,           // 40% slower in rain (common in monsoon)
        'fog': 1.6             // 60% slower in fog (winter mornings)
    }
};

/**
 * Determines current time period for traffic calculation
 * @returns {string} Time period category
 */
function getCurrentTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) return 'morning-rush';
    if (hour >= 17 && hour <= 20) return 'evening-rush';
    if (hour >= 23 || hour <= 5) return 'night';
    return 'normal';
}

/**
 * Simulates Bangalore weather conditions based on season
 * @returns {string} Weather condition
 */
function simulateWeather() {
    const month = new Date().getMonth();
    const random = Math.random();
    
    // Monsoon season (June to September)
    if (month >= 5 && month <= 8) {
        if (random < 0.6) return 'rain';
    }
    // Winter season (December to February)
    else if (month >= 11 || month <= 1) {
        if (random < 0.3) return 'fog';
    }
    
    return 'clear';
}

/**
 * Calculates congestion level for a road segment
 * @param {number} baseSpeed - Base speed limit of the road
 * @param {number} timeFactor - Time-based traffic factor
 * @param {number} weatherFactor - Weather-based traffic factor
 * @returns {Object} Congestion details including level and current speed
 */
function calculateCongestion(baseSpeed, timeFactor, weatherFactor) {
    // Add some randomness to simulate real-world variations
    const randomFactor = 0.8 + (Math.random() * 0.4); // Random factor between 0.8 and 1.2
    
    const currentSpeed = baseSpeed / (timeFactor * weatherFactor * randomFactor);
    
    // Calculate congestion percentage
    const congestionPercent = ((baseSpeed - currentSpeed) / baseSpeed) * 100;
    
    // Determine congestion level based on Bangalore traffic patterns
    let level;
    if (congestionPercent < 25) level = 'LOW';
    else if (congestionPercent < 50) level = 'MODERATE';
    else if (congestionPercent < 75) level = 'HIGH';
    else level = 'SEVERE';
    
    return {
        level,
        currentSpeed: Math.round(currentSpeed),
        congestionPercent: Math.round(congestionPercent)
    };
}

/**
 * Simulates traffic conditions for Bangalore road segments
 * @returns {Promise<Object>} Traffic data for all segments
 */
async function simulateTraffic() {
    console.log('Starting traffic simulation...');
    
    const timePeriod = getCurrentTimePeriod();
    const weather = simulateWeather();
    
    const timeFactor = trafficFactors.timeOfDay[timePeriod];
    const weatherFactor = trafficFactors.weather[weather];
    
    console.log('Current conditions:', { timePeriod, weather });
    
    const trafficData = {
        timestamp: new Date().toISOString(),
        weather,
        timePeriod,
        segments: roadSegments.map(segment => {
            const congestion = calculateCongestion(
                segment.baseSpeed,
                timeFactor,
                weatherFactor
            );
            
            return {
                id: segment.id,
                name: segment.name,
                baseSpeed: segment.baseSpeed,
                ...congestion
            };
        })
    };
    
    console.log('Traffic simulation completed successfully');
    return trafficData;
}

module.exports = {
    simulateTraffic
};
