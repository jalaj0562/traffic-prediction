# Traffic Prediction Project

This project consists of a web application for Bangalore traffic prediction with a client-server architecture.

## Project Structure

```
.
├── client/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── index.html
└── server/
    ├── index.js
    ├── routes.js
    └── trafficPrediction.js
```

## Components

- **Client**: Frontend web interface built with HTML, CSS, and JavaScript
- **Server**: Backend service handling traffic prediction logic

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server/index.js
```

3. Access the application through your web browser

## Files

- `server/trafficPrediction.js`: Core traffic prediction logic
- `server/routes.js`: API route definitions
- `server/index.js`: Server initialization and configuration
- `client/js/main.js`: Frontend JavaScript logic
- `client/css/style.css`: Application styling
- `client/index.html`: Main web interface
