const path = require("path");
const analyticsRoutes = require("./analytics/analytics.routes");
const {
  trackEvent,
} = require("./analytics/analytics.service");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://ai-sales-assistant-dev.myshopify.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Routes
app.use("/chat", require("./routes/query.routes"));

app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});

app.use("/analytics", analyticsRoutes);