const express = require('express');
const app = express();

const authRoutes = express.Router();
authRoutes.post('/register', (req, res) => {
  try {
    const { fullName } = req.body;
    res.json({ success: true, fullName });
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate registration." });
  }
});

app.use('/api/auth', authRoutes);
app.use(express.json());

app.listen(6000, async () => {
  try {
    const res = await fetch("http://localhost:6000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Test" })
    });
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("TEXT:", text);
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
});
