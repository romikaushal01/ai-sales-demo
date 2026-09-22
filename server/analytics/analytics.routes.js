
const express = require("express");
const router = express.Router();

const {
  getAnalytics,
} = require("./analytics.service");


router.get("/", async (req, res) => {

  const period = req.query.period || "all";

  const analytics = await getAnalytics(period);

  res.json(analytics);

});

module.exports = router;