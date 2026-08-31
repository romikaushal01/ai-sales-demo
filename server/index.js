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

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

app.use(express.json());

// Routes
app.use("/chat", require("./routes/query.routes"));

app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});

app.use("/analytics", analyticsRoutes);