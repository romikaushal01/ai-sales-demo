const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
console.log("ENV CHECK");
console.log("SHOP =", process.env.SHOPIFY_STORE_DOMAIN);
console.log("TOKEN =", process.env.SHOPIFY_STOREFRONT_TOKEN ? "Loaded" : "Missing");
console.log("PORT =", process.env.PORT);
const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// Routes
app.use("/chat", require("./routes/query.routes"));

app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});