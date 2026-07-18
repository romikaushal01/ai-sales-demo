function buildResponse(filters, products, total = products.length, isShowMore = false) {

  if (!products.length) {

    let reply = "Sorry, I couldn't find any matching products.";

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

    if (suggestions.length) {
      reply += "\n\nTry:\n• " + suggestions.join("\n• ");
    }

    return {
      reply,
      products: [],
      suggestions,
      hasMore: false,
    };
  }

  let reply = `I found ${total} matching product`;

  if (total > 1) {
    reply += "s";
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

  if (details.length) {
    reply += ` for ${details.join(" ")}`;
  }

  // 👇 New UX
  // Show More
  if (isShowMore) {
    return {
      reply: `Showing the remaining ${products.length} product${products.length > 1 ? "s" : ""}.`,
      products,
      hasMore: false,
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
    hasMore: total > products.length,
  };
}

module.exports = buildResponse;