// Import required modules
const express = require('express');
const multer = require("multer");
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
const axios = require('axios');
const session = require('express-session');

// Database setup with Mongoose
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the schema for users, including a list of friends
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: { type: [String], default: [] } // List of usernames added as friends
});
const User = mongoose.model('User', UserSchema);
module.exports = User;

// Configure multer for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads")); // Specify destination folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filenames
  },
});
const upload = multer({ storage });

const app = express();
const port = 3000; // Server port

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Configure sessions for storing user state
app.use(session({
  secret: 'your-secret-key', // Replace with a secure key in production
  resave: false,
  saveUninitialized: true
}));

// Middleware to generate a random nonce for CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Configure Helmet for security, including a strict Content Security Policy (CSP)
app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, 'https://d3js.org'],
          styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
          imgSrc: ["'self'", 'data:', 'https://i.scdn.co', 'https://www.pixel4k.com'],
          connectSrc: ["'self'", 'https://api.spotify.com'],
        },
      },
    })
);

// Load environment variables from the .env file
require('dotenv').config();

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

// Spotify login route - redirects to the Spotify authorization page
app.get('/login', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-top-read user-read-private user-read-email`;
  res.redirect(authUrl);
});

// Spotify callback handler - exchanges authorization code for an access token
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const redirectTo = req.query.redirect || '/'; // Redirect to homepage by default

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
    // Request access token from Spotify
    const response = await axios.post(authOptions.url, new URLSearchParams(authOptions.form), { headers: authOptions.headers });
    const accessToken = response.data.access_token;
    req.session.access_token = accessToken; // Store access token in session

    // Redirect to frontend with the access token as a query parameter
    res.redirect(`${redirectTo}?access_token=${accessToken}`);
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(500).send('Authentication failed');
  }
});

// Fetch user's top Spotify tracks
app.get('/top-tracks', async (req, res) => {
  const accessToken = req.session.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    res.json(response.data.items); // Return top tracks as JSON
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Check authentication status
app.get('/auth-status', (req, res) => {
  if (req.session.access_token) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve the main HTML file
});

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://myUser:myPassword@spaceify1.dt8a4.mongodb.net/?retryWrites=true&w=majority&appName=Spaceify1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Add more routes for registration, friends management, profile data, etc. (explained similarly to the routes above)

// Start the server
const server = app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});

module.exports = server;
