// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT__URL ="https://buzztube-frontend.onrender.com";

app.use(
  cors({
    origin: CLIENT__URL,
    methods: ["GET"],
  })
);

// Optional small in-memory cache (for dev, prevents hitting API too much)
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query.trim()) {
      return res.json([]);
    }

    const cacheKey = query.trim().toLowerCase();
    const now = Date.now();

    // Check cache
    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (now - timestamp < CACHE_TTL_MS) {
        return res.json(data);
      }
    }

    const apiUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    // Cache result
    cache.set(cacheKey, { data, timestamp: now });

    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching YouTube suggestions:", err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 CORS allowed from: ${CLIENT__URL}`);
});
