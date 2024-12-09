// Import required modules
const express = require('express');
const multer = require("multer");
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
const axios = require('axios');
const session = require('express-session');

// Configure spaceify user database and friends feature
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Define the User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: { type: [String], default: [] },
  screenshot: { type: String }, //path to the uploaded screenshot
  uploadDate: { type: Date } //date the screenshot was uploaded
});
const User = mongoose.model('User', UserSchema);
module.exports = User;

// Configure multer for uploading results image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const app = express();
const port = 3000; // Define the port variable

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Assuming your static files are in a 'public' directory
// Configure session management
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

// A sample route to test the middleware
app.get('/test-csp', (req, res) => {
  res.send('CSP Test');
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

// Redirect to Spotify authorization page
app.get('/login', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-top-read user-read-private user-read-email`;
  res.redirect(authUrl);
});

// Handle Spotify callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const redirectTo = req.query.redirect || '/'; // Default to homepage if no redirect specified

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
    res.redirect(`${redirectTo}?access_token=${accessToken}`);
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
    //res.json({ firstName: 'Tobi' });
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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server and export the instance
const server = app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});

// Serve profile.html
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Connect to MongoDB
mongoose.connect('mongodb+srv://myUser:myPassword@spaceify1.dt8a4.mongodb.net/?retryWrites=true&w=majority&appName=Spaceify1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Register.html route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.', username });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Spaceify user login
app.post('/spaceify-login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.username = user.username; // store username in session
    const accessToken = crypto.randomBytes(16).toString('hex'); // mock access token
    req.session.access_token = accessToken; // store in session

    res.status(200).json({ message: 'Login successful.', username, accessToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get the list of friends for a user
app.get('/friends', async (req, res) => {
  const username = req.query.username;

  try {
      const user = await User.findOne({ username });
      if (!user) {
          return res.status(404).json({ error: 'User not found.' });
      }
      res.json({ friends: user.friends });
  } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ error: 'Internal server error.' });
  }
});

// Add/remove friends
app.post("/friends/manage", async (req, res) => {
  const { username, friendUsername } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found." });

    const friend = await User.findOne({ username: friendUsername });
    if (!friend) return res.status(404).json({ error: "Friend not found." });

    if (user.friends.includes(friendUsername)) {
      // Remove friend
      user.friends = user.friends.filter((f) => f !== friendUsername);
      await user.save();
      return res.json({ message: `${friendUsername} removed from your friends.` });
    } else {
      // Add friend
      user.friends.push(friendUsername);
      await user.save();
      return res.json({ message: `${friendUsername} added to your friends.` });
    }
  } catch (error) {
    console.error("Error managing friend:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Upload a screenshot of your results
app.post("/upload-screenshot", upload.single("screenshot"), async (req, res) => {
  const username = req.session.username;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const filePath = `/uploads/${req.file.filename}`;
    console.log("File uploaded to:", filePath);
    const uploadDate = new Date();

    // Update user's screenshot and upload date
    await User.updateOne(
      { username },
      { screenshot: filePath, uploadDate }
    );

    res.json({ screenshot: filePath, uploadDate });
  } catch (error) {
    console.error("Error uploading screenshot:", error);
    res.status(500).json({ error: "Failed to upload screenshot." });
  }
});

// Fetch another user's uploaded results screenshot
app.get("/profile-data", async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      username: user.username,
      friends: user.friends,
      screenshot: user.screenshot,
      uploadDate: user.uploadDate,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ error: "Failed to fetch profile data." });
  }
});

module.exports = server;