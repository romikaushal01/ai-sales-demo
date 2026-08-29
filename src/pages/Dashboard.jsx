import { useEffect, useState } from "react";
import Pagination from "../components/common/Pagination";
import usePagination from "../hooks/usePagination";
import {
  Search,
  ShoppingCart,
  CreditCard,
  Sparkles,
} from "lucide-react";

import StatCard from "../components/StatCard";
import { getAnalytics } from "../services/analytics";
import "./Dashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    loadAnalytics(period);
  }, [period]);

  async function loadAnalytics(selectedPeriod = period) {
    try {
      const data = await getAnalytics(selectedPeriod);
      setAnalytics(data);
      setActivityPage(1);
    } catch (err) {
      console.error("Analytics error:", err);
    }
  }

  function exportTrendCSV() {
    if (!analytics.trend?.length) {
      return;
    }

    const headers = [
      "Date",
      "Searches",
      "Recommendations",
      "Add To Cart",
      "Checkout",
    ];

    const rows = analytics.trend.map(item => [
      item.date,
      item.searches,
      item.recommendations,
      item.addToCart,
      item.checkout,
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map(row =>
        row
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-analytics-${period}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportFullAnalyticsCSV() {
    const rows = [];

    // Overview
    rows.push(["OVERVIEW"]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total Events", analytics.overview?.totalEvents || 0]);
    rows.push(["Total Searches", analytics.overview?.totalSearches || 0]);
    rows.push([
      "Total Recommendations",
      analytics.overview?.totalRecommendations || 0,
    ]);
    rows.push([
      "Total Add To Cart",
      analytics.overview?.totalAddToCart || 0,
    ]);
    rows.push([
      "Total Checkout Clicks",
      analytics.overview?.totalCheckoutClicks || 0,
    ]);

    rows.push([]);

    // Helper
    const addSection = (title, items, countLabel) => {
      rows.push([title]);
      rows.push(["Rank", "Value", "Count"]);

      if (items?.length) {
        items.forEach((item, index) => {
          rows.push([
            index + 1,
            item.value,
            `${item.count} ${countLabel}${item.count === 1 ? "" : "s"}`,
          ]);
        });
      } else {
        rows.push(["", "No data", ""]);
      }

      rows.push([]);
    };

    addSection(
      "TOP SEARCHES",
      analytics.topSearches,
      "search"
    );

    addSection(
      "NO-RESULT SEARCHES",
      analytics.noResultSearches,
      "search"
    );

    addSection(
      "TOP BRANDS",
      analytics.topBrands,
      "search"
    );

    addSection(
      "TOP CATEGORIES",
      analytics.topCategories,
      "search"
    );

    addSection(
      "TOP COLORS",
      analytics.topColors,
      "search"
    );

    addSection(
      "TOP PRODUCTS",
      analytics.topProducts,
      "add to cart"
    );

    addSection(
      "TOP RECOMMENDATIONS",
      analytics.topRecommendations,
      "recommendation"
    );

    // Trend
    rows.push(["TREND ANALYTICS"]);
    rows.push([
      "Date",
      "Searches",
      "Recommendations",
      "Add To Cart",
      "Checkout",
    ]);

    analytics.trend?.forEach((item) => {
      rows.push([
        item.date,
        item.searches,
        item.recommendations,
        item.addToCart,
        item.checkout,
      ]);
    });

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-full-analytics-${period}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const ITEMS_PER_PAGE = 7;

  const {
    currentPage: activityPage,
    totalPages: totalActivityPages,
    paginatedData: paginatedActivities,
    setCurrentPage: setActivityPage,
  } = usePagination(
    analytics?.recentEvents || [],
    ITEMS_PER_PAGE
  );
  const {
    currentPage: searchPage,
    totalPages: totalSearchPages,
    paginatedData: paginatedSearches,
    setCurrentPage: setSearchPage,
  } = usePagination(
    analytics?.topSearches || [],
    ITEMS_PER_PAGE
  );
  const {
    currentPage: noResultPage,
    totalPages: totalNoResultPages,
    paginatedData: paginatedNoResultSearches,
    setCurrentPage: setNoResultPage,
  } = usePagination(
    analytics?.noResultSearches || [],
    ITEMS_PER_PAGE
  );

  if (!analytics) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  const searches = analytics.overview.totalSearches;
  const recommendations = analytics.overview.totalRecommendations;
  const addToCart = analytics.overview.totalAddToCart;
  const checkout = analytics.overview.totalCheckoutClicks;

  const recommendationRate = searches
    ? Math.round((recommendations / searches) * 100)
    : 0;

  const addToCartRate = recommendations
    ? Math.round((addToCart / recommendations) * 100)
    : 0;

  const checkoutRate = addToCart
    ? Math.round((checkout / addToCart) * 100)
    : 0; 

  const overallConversionRate = searches
  ? Math.round((checkout / searches) * 100)
  : 0;

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div className="header-text">
          <h1>AI Sales Dashboard</h1>
          <p>Overview of your AI shopping assistant</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="period-select"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>

      <div className="stats-grid">

        <StatCard
          title="Searches"
          value={analytics.overview.totalSearches}
          icon={Search}
        />

        <StatCard
          title="Recommendations"
          value={analytics.overview.totalRecommendations}
          icon={Sparkles}
        />

        <StatCard
          title="Add To Cart"
          value={analytics.overview.totalAddToCart}
          icon={ShoppingCart}
        />

        <StatCard
          title="Checkout"
          value={analytics.overview.totalCheckoutClicks}
          icon={CreditCard}
        />

      </div>

      <div className="analytics-grid">
        {/* Top Searches */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>Top Searches</h2>
              <p>Most common product searches</p>
            </div>
          </div>

          <div className="search-list">
            {analytics.topSearches?.length > 0 ? (
              paginatedSearches.map((item, index) => (
                <div className="search-row" key={index}>
                  <div className="search-rank">
                    #{(searchPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </div>

                  <div className="search-name">
                    {item.value}
                  </div>

                  <div className="search-count">
                    {item.count}
                    {item.count === 1 ? " search" : " searches"}

                    {index === 0 && searchPage === 1 && (
                      <span className="popular-search-badge">
                        🔥 Most searched
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">
                No search data yet.
              </p>
            )}
          </div>
          <Pagination
            currentPage={searchPage}
            totalPages={totalSearchPages}
            onPageChange={setSearchPage}
          />
        </div>

        {/* Top Products */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>Top Products</h2>
              <p>Products added to cart most often</p>
            </div>
          </div>

          <div className="search-list">
            {analytics.topProducts?.length > 0 ? (
              analytics.topProducts.map((item, index) => (
                <div className="search-row" key={index}>
                  <div className="search-rank">
                    #{index + 1}
                  </div>

                  <div className="search-name">
                    {item.value}
                  </div>

                  <div className="search-count">
                    {item.count}
                    {item.count === 1 ? " add to cart" : " adds to cart"}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">
                No product data yet.
              </p>
            )}
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>Top Recommendations</h2>
              <p>Products recommended most often</p>
            </div>
          </div>

          <div className="search-list">
            {analytics.topRecommendations?.length > 0 ? (
              analytics.topRecommendations.map((item, index) => (
                <div className="search-row" key={index}>
                  <div className="search-rank">
                    #{index + 1}
                  </div>

                  <div className="search-name">
                    {item.value}
                  </div>

                  <div className="search-count">
                    {item.count}
                    {item.count === 1 ? " recommendation" : " recommendations"}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">
                No recommendation data yet.
              </p>
            )}
          </div>
        </div>
        
        {/* No-Result Searches */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>No-Result Searches</h2>
              <p>Searches that returned no products</p>
            </div>
          </div>

          <div className="search-list">
            {analytics.noResultSearches?.length > 0 ? (
              paginatedNoResultSearches.map((item, index) => (
                <div className="search-row no-result-search-row" key={index}>
                  <div className="search-rank">
                    #{(noResultPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </div>

                  <div className="search-name">
                    {item.value}
                  </div>

                  <div className="search-count">
                    {item.count}
                    {item.count === 1 ? " search" : " searches"}
                    <span className="no-result-badge">
                      ⚠️ No results
                    </span>

                    {index === 0 && (
                      <span className="opportunity-badge">
                        💡 Product opportunity
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">
                No failed searches yet.
              </p>
            )}
          </div>
          <Pagination
            currentPage={noResultPage}
            totalPages={totalNoResultPages}
            onPageChange={setNoResultPage}
          />
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="analytics-card recent-activity-card">
        <div className="analytics-card-header">
          <div>
            <h2>Recent Activity</h2>
            <p>Latest actions from your AI shopping assistant</p>
          </div>
        </div>

        <div className="activity-list">
          {analytics.recentEvents?.length > 0 ? (
            paginatedActivities.map((event, index) => (
              <div
                className={`activity-row activity-${event.event.toLowerCase()}`}
                key={index}
              >

                <div className="activity-icon">
                  {event.event === "SEARCH_PRODUCT" && "🔍"}
                  {event.event === "RECOMMEND_PRODUCT" && "✨"}
                  {event.event === "ADD_TO_CART" && "🛒"}
                  {event.event === "CHECKOUT_CLICK" && "💳"}
                </div>

                <div className="activity-info">
                  <strong>
                    {event.event === "SEARCH_PRODUCT" && "Product Search"}
                    {event.event === "RECOMMEND_PRODUCT" && "Product Recommended"}
                    {event.event === "ADD_TO_CART" && "Added To Cart"}
                    {event.event === "CHECKOUT_CLICK" && "Checkout Started"}
                  </strong>

                  <span>
                    {event.event === "SEARCH_PRODUCT"
                      ? `Searched for "${event.query}"`
                      : event.event === "CHECKOUT_CLICK"
                        ? `${event.items || 0} item${event.items === 1 ? "" : "s"} in cart`
                        : event.productTitle || "Shopping activity"}
                  </span>
                </div>

                <div className="activity-time">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

              </div>
            ))
          ) : (
            <p className="empty-text">No recent activity yet.</p>
          )}
        </div>
        <Pagination
          currentPage={activityPage}
          totalPages={totalActivityPages}
          onPageChange={setActivityPage}
        />
      </div>

      {/* Conversion Funnel */}
      <div className="analytics-card funnel-card">
        <div className="analytics-card-header">
          <div>
            <h2>Conversion Funnel</h2>
            <p>How users move through the buying journey</p>
          </div>
        </div>

        <div className="funnel-list">

          {/* Searches */}
          <div className="funnel-row">
            <div className="funnel-info">
              <span className="funnel-label">🔍 Searches</span>
              <strong>
                {analytics.overview.totalSearches}
              </strong>
            </div>

            <div className="funnel-bar">
              <div
                className="funnel-fill"
                style={{
                  width: searches > 0 ? "100%" : "0%",
                }}
              />
            </div>

            <span className="funnel-percent">{searches > 0 ? "100%" : "0%"}</span>
          </div>

          {/* Search → Recommendation */}
          <div className="funnel-row">
            <div className="funnel-info">
              <span className="funnel-label">
                ✨ Recommendations
              </span>

              <strong>
                {analytics.overview.totalRecommendations}
              </strong>
            </div>

            <div className="funnel-bar">
              <div
                className="funnel-fill"
                style={{
                  width: `${recommendationRate}%`,
                }}
              />
            </div>

            <span className="funnel-percent">
              {recommendationRate}%
            </span>
          </div>

          {/* Recommendation → Add To Cart */}
          <div className="funnel-row">
            <div className="funnel-info">
              <span className="funnel-label">
                🛒 Add To Cart
              </span>

              <strong>
                {analytics.overview.totalAddToCart}
              </strong>
            </div>

            <div className="funnel-bar">
              <div
                className="funnel-fill"
                style={{
                  width: `${addToCartRate}%`,
                }}
              />
            </div>

            <span className="funnel-percent">
              {addToCartRate}%
            </span>
          </div>

          {/* Add To Cart → Checkout */}
          <div className="funnel-row">
            <div className="funnel-info">
              <span className="funnel-label">
                💳 Checkout
              </span>

              <strong>
                {analytics.overview.totalCheckoutClicks}
              </strong>
            </div>

            <div className="funnel-bar">
              <div
                className="funnel-fill"
                style={{
                  width: `${checkoutRate}%`,
                }}
              />
            </div>

            <span className="funnel-percent">
              {checkoutRate}%
            </span>
          </div>

        </div>
      </div>

      {/* Conversion Performance */}
      <div className="conversion-performance">
        <div className="analytics-card-header">
          <div>
            <h2>Conversion Performance</h2>
            <p>How effectively users move through the buying journey</p>
          </div>
        </div>

        <div className="conversion-metrics">

          <div className="conversion-metric">
            <span>✨ Recommendation Rate</span>
            <strong>{recommendationRate}%</strong>
            <small>Searches → Recommendations</small>
          </div>

          <div className="conversion-metric">
            <span>🛒 Add To Cart Rate</span>
            <strong>{addToCartRate}%</strong>
            <small>Recommendations → Add To Cart</small>
          </div>

          <div className="conversion-metric">
            <span>💳 Checkout Rate</span>
            <strong>{checkoutRate}%</strong>
            <small>Add To Cart → Checkout</small>
          </div>

          <div className="conversion-metric">
            <span>🎯 Overall Conversion</span>
            <strong>
              {overallConversionRate}%
            </strong>
            <small>Searches → Checkout</small>
          </div>

        </div>
      </div>

      {/* Search Intelligence */}
      <div className="analytics-card search-intelligence-card">
        <div className="analytics-card-header">
          <div>
            <h2>Search Intelligence</h2>
            <p>What customers are looking for</p>
          </div>
        </div>

        <div className="search-intelligence-grid">

          {/* Top Brands */}
          <div className="intelligence-section">
            <h3>🏷️ Top Brands</h3>

            <div className="search-list">
              {analytics.topBrands?.length > 0 ? (
                analytics.topBrands.slice(0, 5).map((item, index) => (
                  <div className="search-row" key={index}>
                    <div className="search-rank">
                      #{index + 1}
                    </div>

                    <div className="search-name">
                      {item.value}
                    </div>

                    <div className="search-count">
                      {item.count}
                      {item.count === 1 ? " search" : " searches"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No brand data yet.</p>
              )}
            </div>
          </div>


          {/* Top Categories */}
          <div className="intelligence-section">
            <h3>👟 Top Categories</h3>

            <div className="search-list">
              {analytics.topCategories?.length > 0 ? (
                analytics.topCategories.slice(0, 5).map((item, index) => (
                  <div className="search-row" key={index}>
                    <div className="search-rank">
                      #{index + 1}
                    </div>

                    <div className="search-name">
                      {item.value}
                    </div>

                    <div className="search-count">
                      {item.count}
                      {item.count === 1 ? " search" : " searches"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No category data yet.</p>
              )}
            </div>
          </div>


          {/* Top Colors */}
          <div className="intelligence-section">
            <h3>🎨 Top Colors</h3>

            <div className="search-list">
              {analytics.topColors?.length > 0 ? (
                analytics.topColors.slice(0, 5).map((item, index) => (
                  <div className="search-row" key={index}>
                    <div className="search-rank">
                      #{index + 1}
                    </div>

                    <div className="search-name">
                      {item.value}
                    </div>

                    <div className="search-count">
                      {item.count}
                      {item.count === 1 ? " search" : " searches"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No color data yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Conversion Insights */}
      <div className="analytics-card conversion-insights-card">
        <div className="analytics-card-header">
          <div>
            <h2>Conversion Insights</h2>
            <p>Key insights from your AI shopping activity</p>
          </div>
        </div>

        <div className="insights-grid">

          {/* Search → Recommendation */}
          <div className="insight-item">
            <div className="insight-icon">💡</div>

            <div className="insight-content">
              <strong>Recommendation Rate</strong>

              <span>
                {recommendationRate}% of searches generated
                recommendations.
              </span>
            </div>
          </div>


          {/* Recommendation → Cart */}
          <div className="insight-item">
            <div className="insight-icon">🛒</div>

            <div className="insight-content">
              <strong>Add To Cart Rate</strong>

              <span>
                {addToCartRate}% of recommendations resulted
                in an add to cart.
              </span>
            </div>
          </div>


          {/* Cart → Checkout */}
          <div className="insight-item">
            <div className="insight-icon">💳</div>

            <div className="insight-content">
              <strong>Checkout Rate</strong>

              <span>
                {checkoutRate}% of add to cart actions reached
                checkout.
              </span>
            </div>
          </div>


          {/* Overall Conversion */}
          <div className="insight-item">
            <div className="insight-icon">🎯</div>

            <div className="insight-content">
              <strong>Overall Conversion</strong>

              <span>
                {searches
                  ? Math.round((checkout / searches) * 100)
                  : 0}
                % of searches reached checkout.
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Trend Analytics */}
      <div className="analytics-card trend-card">
        <div className="analytics-card-header">
          <div>
            <h2>Trend Analytics</h2>
            <p>AI shopping activity over time</p>
          </div>
          <div className="export-actions">
            <button
              className="export-button"
              onClick={exportTrendCSV}
              disabled={!analytics.trend?.length}
            >
              ↓ Trend CSV
            </button>

            <button
              className="export-button"
              onClick={exportFullAnalyticsCSV}
              disabled={!analytics}
            >
              ↓ Full Analytics
            </button>
          </div>
        </div>

        <div className="trend-chart">
          {analytics.trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={analytics.trend}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />

                <YAxis allowDecimals={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) {
                      return null;
                    }

                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-date">{label}</div>

                        {payload.map((entry) => (
                          <div className="tooltip-row" key={entry.dataKey}>
                            <span>{entry.name}</span>
                            <strong>{entry.value}</strong>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Line
                  type="linear"
                  dataKey="searches"
                  name="Searches"
                  strokeWidth={2}
                  stroke="#3b82f6"
                />

                <Line
                  type="linear"
                  dataKey="recommendations"
                  name="Recommendations"
                  strokeWidth={2}
                  stroke="#8b5cf6"
                />

                <Line
                  type="linear"
                  dataKey="addToCart"
                  name="Add To Cart"
                  strokeWidth={2}
                  stroke="#f59e0b"
                />

                <Line
                  type="linear"
                  dataKey="checkout"
                  name="Checkout"
                  strokeWidth={2}
                  stroke="#10b981"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-text">
              No activity data available for this period.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}