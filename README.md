# Traffic Prediction System

A real-time traffic prediction and route recommendation system for Bangalore city.

## Features

- Real-time traffic condition monitoring
- Multiple route recommendations based on current traffic
- Interactive map visualization
- Dark/Light theme support
- Responsive design

## Deployment on GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Select the main branch as source
   - Save the settings

3. Update the configuration:
   - In `client/js/config.js`, the baseUrl will automatically detect GitHub Pages environment
   - No additional configuration needed for client-side code

4. Deploy the backend:
   - The backend needs to be deployed separately (e.g., on Heroku, Railway, etc.)
   - Set the `GITHUB_PAGES_URL` environment variable in your backend deployment to match your GitHub Pages URL
   - Update the CORS configuration in `server/index.js` if needed

## Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd traffic-prediction-system
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## Environment Variables

- `PORT`: Server port (default: 3000)
- `GITHUB_PAGES_URL`: Your GitHub Pages URL (for CORS configuration)

## API Endpoints

- `GET /api/traffic`: Get current traffic conditions
- `GET /api/routes`: Get route recommendations
  - Query parameters:
    - `origin`: Starting point
    - `destination`: End point

## Technologies Used

- Frontend:
  - HTML5, CSS3, JavaScript (ES6+)
  - Leaflet.js for maps
  - Custom theme implementation
- Backend:
  - Node.js
  - Express.js
  - CORS for security

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License
