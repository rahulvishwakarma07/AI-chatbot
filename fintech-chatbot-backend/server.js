const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
require('dotenv').config();

const { classifyQuery, generateResponse } = require('./services/geminiService');
const { queryDatabase } = require('./services/databaseService');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Middleware: Verify JWT
function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "No token" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Routes
app.post('/api/chat', authMiddleware, async (req, res) => { 
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Classify the query
    const classification = await classifyQuery(message);
    console.log('Query classification:', classification);

    let response;
    
    if (classification.type === 'data') {
      // Step 2: If data query, fetch from database
      const dbResults = await queryDatabase(message, classification.intent,req.userId);
      
      if (dbResults.length > 0) {
        // Step 3: Generate natural language response with data
        response = await generateResponse(message, dbResults, 'data');
      } else {
        response = "Sorry, no data was found in the database for your query.";
      }
    } else {
      // Step 4: General query - direct LLM response
      response = await generateResponse(message, null, 'general');
    }

    res.json({
      message: message,
      response: response,
      type: classification.type,
      intent: classification.intent || null
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chatbot server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});