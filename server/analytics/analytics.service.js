
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

function countBy(events, eventName, field) {
  const counts = {};

  events
    .filter(e => e.event === eventName && e[field])
    .forEach(e => {
      counts[e[field]] = (counts[e[field]] || 0) + 1;
    });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
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

    overview: {
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
    },

    topSearches: countBy(
      events,
      "SEARCH_PRODUCT",
      "query"
    ),

    topProducts: countBy(
      events,
      "ADD_TO_CART",
      "productTitle"
    ),

    topRecommendations: countBy(
      events,
      "RECOMMEND_PRODUCT",
      "productTitle"
    ),

    recentEvents: events
      .slice(-10)
      .reverse(),
  };
}

module.exports = {
  trackEvent,
  getAnalytics,
};