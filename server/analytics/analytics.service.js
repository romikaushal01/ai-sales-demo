
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

function buildTrend(events) {
  const trends = {};

  events.forEach(event => {
    const date = new Date(event.timestamp)
      .toISOString()
      .split("T")[0];

    if (!trends[date]) {
      trends[date] = {
        date,
        searches: 0,
        recommendations: 0,
        addToCart: 0,
        checkout: 0,
      };
    }

    if (event.event === "SEARCH_PRODUCT") {
      trends[date].searches++;
    }

    if (event.event === "RECOMMEND_PRODUCT") {
      trends[date].recommendations++;
    }

    if (event.event === "ADD_TO_CART") {
      trends[date].addToCart++;
    }

    if (event.event === "CHECKOUT_CLICK") {
      trends[date].checkout++;
    }
  });

  return Object.values(trends).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

function getAnalytics(period = "all") {
  const allEvents = readEvents();

  let events = allEvents;

  const now = new Date();

  if (period === "today") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    events = allEvents.filter(
      e => new Date(e.timestamp) >= startOfToday
    );
  }

  if (period === "7days") {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);

    events = allEvents.filter(
      e => new Date(e.timestamp) >= startDate
    );
  }

  if (period === "30days") {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);

    events = allEvents.filter(
      e => new Date(e.timestamp) >= startDate
    );
  }


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

    trend: buildTrend(events),

    topSearches: countBy(
      events,
      "SEARCH_PRODUCT",
      "query"
    ),
    noResultSearches: countBy(
      events.filter(
        e =>
          e.event === "SEARCH_PRODUCT" &&
          Number(e.results) === 0
      ),
      "SEARCH_PRODUCT",
      "query"
    ),
    topBrands: countBy(
      events,
      "SEARCH_PRODUCT",
      "brand"
    ),

    topCategories: countBy(
      events,
      "SEARCH_PRODUCT",
      "category"
    ),

    topColors: countBy(
      events,
      "SEARCH_PRODUCT",
      "color"
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
      .slice(-50)
      .reverse(),
  };
}

module.exports = {
  trackEvent,
  getAnalytics,
};