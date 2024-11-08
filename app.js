const express = require('express');
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
const axios = require('axios');
const session = require('express-session');

const app = express();
const port = 3000; // Define the port variable

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Assuming your static files are in a 'public' directory
app.use(session({
  secret: 'your-secret-key', // Change this to a secure key
  resave: false,
  saveUninitialized: true
}));

// Middleware to generate a nonce for each request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Helmet configuration with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, 'https://d3js.org'],
        styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
        imgSrc: ["'self'", 'data:', 'https://www.pixel4k.com'],
      },
    },
  })
);


const CLIENT_ID = '89cd82b2bc114cde888005822373c259'; // Your Spotify client ID
const CLIENT_SECRET = 'c7fdc87c8d12446d89080c9691a05ea9'; // Your Spotify client secret
const REDIRECT_URI = 'http://localhost:3000/callback';


// Redirect to Spotify authorization page
app.get('/login', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-top-read user-read-private user-read-email`;
  res.redirect(authUrl);
});

// Handle Spotify callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  };

  try {
    const response = await axios.post(authOptions.url, new URLSearchParams(authOptions.form), { headers: authOptions.headers });
    const accessToken = response.data.access_token;
    req.session.access_token = accessToken; // Store the access token in session

    // Redirect to frontend with the access token as a query parameter
    res.redirect(`/?access_token=${accessToken}`);
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(500).send('Authentication failed');
  }
});


// Fetch top tracks from Spotify
app.get('/top-tracks', async (req, res) => {
  const accessToken = req.session.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    res.json(response.data.items); // Send back the top tracks
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});
app.get('/auth-status', (req, res) => {
  if (req.session.access_token) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});


// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve your HTML file
});

//starts the server and logs a message to the console
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});


//call playMusic function from main.js
soundFile.load();
soundFile.volume = 30;
soundFile.playMusic();