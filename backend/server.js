const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// पुराने मॉडल्स लोड हो रहे हैं
const User = require('./models/User');

// 🏢 नया काम: कंपनी प्रोफाइल मॉडल को यहाँ लोड कर रहे हैं
// (याद रखना, इसके लिए हम अगले स्टेप में backend/models/CompanyProfile.js फ़ाइल बनाएंगे)
const CompanyProfile = require('./models/CompanyProfile');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup (पहले जैसा ही)
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

// Database Portal Initializer (पहले जैसा ही)
const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internup";
mongoose.connect(dbURI)
    .then(() => console.log("🔌 Connected to MongoDB Successfully!"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// =========================================================================
// 📝 Route: Dynamic Registration Engine (पहले जैसा ही, कोई बदलाव नहीं)
// =========================================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, companyName, email, password, userRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password are required" });
    }

    if (userRole === "student" && !fullName) {
      return res.status(400).json({ error: "Full Name is required" });
    }

    if (userRole === "company" && !companyName) {
      return res.status(400).json({ error: "Company Name is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newUser = new User({
      fullName,
      companyName,
      email,
      password,
      userRole,
    });

    await newUser.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔑 Route: Core Verification Sign In (पहले जैसा ही, कोई बदलाव नहीं)
// =========================================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are mandatory parameters." });
        }

        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(400).json({ error: "Invalid email or account password." });
        }

        res.status(200).json({ 
            message: "Success", 
            user: { fullName: user.fullName, companyName: user.companyName, email: user.email, userRole: user.userRole } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// 🏢 🆕 नया फ़ीचर Route: कंपनी का प्रोफाइल डेटा सेव करने के लिए
// =========================================================================
app.post("/api/profile/company", async (req, res) => {
  try {
    // फ़्रंटएंड से भेजा गया कंपनी का सारा डेटा req.body में आएगा
    const newProfile = new CompanyProfile(req.body);
    
    // उसे डेटाबेस में सेव कर रहे हैं
    await newProfile.save();
    
    res.status(201).json({ message: "Company profile created seamlessly!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
});