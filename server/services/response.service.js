function buildResponse(filters, products) {
  if (!products.length) {
    return {
      reply: "Sorry, I couldn't find any matching products.",
      products: [],
    };
  }

  let reply = `I found ${products.length} matching product`;

  if (products.length > 1) {
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

  reply += ".";

  return {
    reply,
    products: products.slice(0, 20),
  };
}

module.exports = buildResponse;