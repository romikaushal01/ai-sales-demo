function buildResponse(filters, products, total = products.length, isShowMore = false) {

  if (!products.length) {

    const suggestions = [];

    // Brand
    if (filters.brand) {
      suggestions.push(`View all ${filters.brand} products`);
    }

    // productType
    if (filters.productType) {
      suggestions.push(`Browse ${filters.productType}`);
    }

    // Budget
    if (filters.maxPrice) {
      suggestions.push(`Increase your budget`);
    }

    // Availability
    if (filters.availability === "in-stock") {
      suggestions.push("Show all products");
    }

    return {
      reply: "Sorry, I couldn't find any matching products.",
      products: [],
      suggestions,
      hasMore: false,
    };
  }

  let reply = "";

  if (filters.sort === "best-selling") {
    reply = `⭐ Here are our ${total} best-selling product${total > 1 ? "s" : ""}`;
  }
  else if (filters.sort === "new") {
    reply = `🆕 Here are ${total} new arrival${total > 1 ? "s" : ""}`;
  }
  else if (filters.availability === "in-stock") {
    reply = `✅ Here ${total > 1 ? "are" : "is"} ${total} product${total > 1 ? "s" : ""} currently in stock`;
  }
  else if (filters.maxPrice) {
    reply = `💰 I found ${total} product${total > 1 ? "s" : ""} under $${filters.maxPrice}`;
  }
  else {
    reply = `I found ${total} matching product${total > 1 ? "s" : ""}`;
  }

  const details = [];

  if (filters.brand) {
    details.push(filters.brand);
  }

  if (filters.productType) {
    details.push(filters.productType);
  }

  if (filters.color) {
    details.push(filters.color);
  }

  if (filters.maxPrice) {
    details.push(`under ${filters.maxPrice}`);
  }

  if (
    details.length &&
    !filters.sort &&
    !filters.availability &&
    !filters.maxPrice
  ) {
    reply += ` for ${details.join(" ")}`;
  }

  // 👇 New UX
  // Show More
  if (isShowMore) {
    return {
      reply: `Showing ${products.length} more product${products.length > 1 ? "s" : ""}.`,
      products,
      hasMore: total > (filters.page * filters.limit),
    };
  }

  // First search
  if (total > products.length) {
    reply += `. Showing the first ${products.length}.`;
  } else {
    reply += ".";
  }

  return {
    reply,
    products,
    hasMore: total > (filters.page * filters.limit),
  };
}

module.exports = buildResponse;