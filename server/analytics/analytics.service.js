const pool = require("../db");

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

async function trackEvent(event) {
  try {
    await pool.query(
      `
      INSERT INTO analytics_events (
        event,
        "timestamp",
        session_id,
        query,
        results,
        product_title,
        brand,
        category,
        color,
        page,
        success,
        sort,
        max_price,
        product_price,
        product_vendor,
        product_type,
        compared_products,
        recommendation_type,
        cart_id,
        items,
        checkout_url
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      `,
      [
        event.event,
        new Date(),
        event.sessionId || null,
        event.query || null,
        event.results ?? null,
        event.productTitle || null,
        event.brand || null,
        event.category || null,
        event.color || null,
        event.page ?? null,
        event.success ?? null,
        event.sort || null,
        event.maxPrice ?? null,
        event.productPrice ?? null,
        event.productVendor || null,
        event.productType || null,
        event.comparedProducts
          ? JSON.stringify(event.comparedProducts)
          : null,
        event.recommendationType || null,
        event.cartId || null,
        event.items ?? null,
        event.checkoutUrl || null,
      ]
    );

    console.log("✅ Analytics event saved:", event.event);
  } catch (error) {
    console.error("❌ Analytics event failed:", error.message);
  }
}

// function buildTrend(events) {
//   const trends = {};

//   events.forEach(event => {
//     const date = new Date(event.timestamp)
//       .toISOString()
//       .split("T")[0];

//     if (!trends[date]) {
//       trends[date] = {
//         date,
//         searches: 0,
//         recommendations: 0,
//         addToCart: 0,
//         checkout: 0,
//       };
//     }

//     if (event.event === "SEARCH_PRODUCT") {
//       trends[date].searches++;
//     }

//     if (event.event === "RECOMMEND_PRODUCT") {
//       trends[date].recommendations++;
//     }

//     if (event.event === "ADD_TO_CART") {
//       trends[date].addToCart++;
//     }

//     if (event.event === "CHECKOUT_CLICK") {
//       trends[date].checkout++;
//     }
//   });

//   return Object.values(trends).sort(
//     (a, b) => a.date.localeCompare(b.date)
//   );
// }

function buildTrend(events, period = "all") {
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

  if (period === "7days" || period === "30days") {
    const days = period === "7days" ? 7 : 30;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateKey = date
        .toISOString()
        .split("T")[0];

      result.push(
        trends[dateKey] || {
          date: dateKey,
          searches: 0,
          recommendations: 0,
          addToCart: 0,
          checkout: 0,
        }
      );
    }

    return result;
  }

  return Object.values(trends).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

async function getAnalytics(period = "all") {
  try {
    let dateFilter = "";
    let params = [];

    if (period === "today") {
      dateFilter = `WHERE "timestamp" >= CURRENT_DATE`;
    }

    if (period === "7days") {
      dateFilter = `
        WHERE "timestamp" >= NOW() - INTERVAL '7 days'
      `;
    }

    if (period === "30days") {
      dateFilter = `
        WHERE "timestamp" >= NOW() - INTERVAL '30 days'
      `;
    }

    const eventsResult = await pool.query(
      `
      SELECT *
      FROM analytics_events
      ${dateFilter}
      ORDER BY "timestamp" ASC
      `,
      params
    );

    const events = eventsResult.rows.map(event => ({
      ...event,
      sessionId: event.session_id,
      productTitle: event.product_title,
      productPrice: event.product_price,
      productVendor: event.product_vendor,
      productType: event.product_type,
      comparedProducts: event.compared_products,
      recommendationType: event.recommendation_type,
      cartId: event.cart_id,
      checkoutUrl: event.checkout_url,
      maxPrice: event.max_price,
    }));

    function countByDB(eventName, field) {
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

    const overview = {
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

    let trend = Object.values(trends).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    if (period === "7days" || period === "30days") {
      const days = period === "7days" ? 7 : 30;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      trend = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const dateKey = date
          .toISOString()
          .split("T")[0];

        trend.push(
          trends[dateKey] || {
            date: dateKey,
            searches: 0,
            recommendations: 0,
            addToCart: 0,
            checkout: 0,
          }
        );
      }
    }

    return {
      overview,

      trend,

      topSearches: countByDB(
        "SEARCH_PRODUCT",
        "query"
      ),

      noResultSearches: (() => {
        const counts = {};

        events
          .filter(
            e =>
              e.event === "SEARCH_PRODUCT" &&
              Number(e.results) === 0 &&
              e.query
          )
          .forEach(e => {
            counts[e.query] = (counts[e.query] || 0) + 1;
          });

        return Object.entries(counts)
          .map(([value, count]) => ({
            value,
            count,
          }))
          .sort((a, b) => b.count - a.count);
      })(),

      topBrands: countByDB(
        "SEARCH_PRODUCT",
        "brand"
      ),

      topCategories: countByDB(
        "SEARCH_PRODUCT",
        "category"
      ),

      topColors: countByDB(
        "SEARCH_PRODUCT",
        "color"
      ),

      topProducts: countByDB(
        "ADD_TO_CART",
        "productTitle"
      ),

      topRecommendations: countByDB(
        "RECOMMEND_PRODUCT",
        "productTitle"
      ),

      recentEvents: events
        .slice(-50)
        .reverse(),
    };

  } catch (error) {
    console.error(
      "❌ Failed to fetch analytics:",
      error.message
    );

    throw error;
  }
}

module.exports = {
  trackEvent,
  getAnalytics,
};