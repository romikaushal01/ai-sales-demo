
const fs = require("fs");
const path = require("path");

const EVENTS_FILE = path.join(__dirname, "events.json");

function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) {
    return [];
  }

  const data = fs.readFileSync(EVENTS_FILE, "utf8");

  return data ? JSON.parse(data) : [];
}

function writeEvents(events) {
  fs.writeFileSync(
    EVENTS_FILE,
    JSON.stringify(events, null, 2)
  );
}

function trackEvent(event) {

  const events = readEvents();

  events.push({
    ...event,
    timestamp: new Date().toISOString(),
  });

  writeEvents(events);

}

function getAnalytics() {

  const events = readEvents();

  return {

    totalEvents: events.length,

    totalSearches: events.filter(
      e => e.event === "SEARCH_PRODUCT"
    ).length,

    totalAddToCart: events.filter(
      e => e.event === "ADD_TO_CART"
    ).length,

    totalCheckoutClicks: events.filter(
      e => e.event === "CHECKOUT_CLICK"
    ).length,

    totalRecommendations: events.filter(
      e => e.event === "RECOMMEND_PRODUCT"
    ).length,

  };

}

module.exports = {
  trackEvent,
  getAnalytics,
};