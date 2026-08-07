
const express = require("express");
const router = express.Router();

const {
  getAnalytics,
} = require("./analytics.service");


router.get("/", (req, res) => {

  const analytics = getAnalytics();

  res.json(analytics);

});

module.exports = router;