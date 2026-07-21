const getCatalog = require("./catalog.service");

function extractBrand(text, vendorIndex = {}) {

  text = text.toLowerCase();

  const words = text.split(/[\s-]+/);

  for (const word of words) {

    if (vendorIndex[word]) {
      return vendorIndex[word];
    }

  }

  return "";

}

function extractProductType(text, productTypes = []) {
  return (
    productTypes.find((type) => text.includes(type)) || ""
  );
}

function extractColor(text) {
  const colors = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
  ];

  return colors.find((c) => text.includes(c)) || "";
}

function extractPrice(text) {
  const match = text.match(
    /(under|below|less than)\s*[$₹£€]?\s*(\d+)/i
  );

  return match ? Number(match[2]) : null;
}

function extractSort(text) {

  text = text.toLowerCase();

  // Best Sellers
  if (
    text.includes("best seller") ||
    text.includes("best sellers") ||
    text.includes("best selling")
  ) {
    return "best-selling";
  }

  // New Arrivals
  if (
    text.includes("new arrival") ||
    text.includes("new arrivals") ||
    text.includes("newest") ||
    text.includes("latest")
  ) {
    return "new";
  }

  // Cheapest
  if (
    text.includes("cheapest") ||
    text.includes("lowest price") ||
    text.includes("low to high") ||
    text.includes("price low to high")
  ) {
    return "price-asc";
  }

  // Most Expensive
  if (
    text.includes("most expensive") ||
    text.includes("highest price") ||
    text.includes("high to low") ||
    text.includes("price high to low")
  ) {
    return "price-desc";
  }

  return "";
}

function extractAvailability(text) {

  text = text.toLowerCase();

  if (
    text.includes("in stock") ||
    text.includes("available") ||
    text.includes("only available")
  ) {
    return "in-stock";
  }

  if (
    text.includes("out of stock") ||
    text.includes("unavailable")
  ) {
    return "out-of-stock";
  }

  return "";
}

function extractKeywords(
  
  text,
  vendorIndex = {},
  productTypes = []
) {
if (
  extractSort(text) ||
  extractAvailability(text)
  ) {
  return [];
}
const ignoreWords = [
  "under",
  "below",
  "less",
  "than",
  "for",
  "with",
  "and",
  "the",
  "a",
  "an",

  // Sorting words
  "best",
  "seller",
  "sellers",
  "selling",
  "new",
  "arrival",
  "arrivals",
  "newest",
  "latest",
  "cheapest",
  "lowest",
  "highest",
  "price",
  "low",
  "high",
  "stock",
  "available",
];

  const brand = extractBrand(text, vendorIndex);
  const productType = extractProductType(text, productTypes);
  const color = extractColor(text);

  return text
    .split(/\s+/)
    .filter((word) => {
      if (word.length < 3) return false;
      if (ignoreWords.includes(word)) return false;

      // Remove brand words
      if (brand && brand.includes(word)) return false;

      // Remove product type words
      if (productType && productType.includes(word)) return false;

      if (word === color) return false;
      if (!isNaN(word)) return false;

      return true;
    });
}

async function parseQuery(text = "") {
  text = text.toLowerCase();

  const catalog = await getCatalog();

  return {
    brand: extractBrand(text, catalog.vendorIndex),
    productType: extractProductType(
      text,
      catalog.productTypes
    ),
    color: extractColor(text),
    maxPrice: extractPrice(text),
    sort: extractSort(text),
    availability: extractAvailability(text),
    keywords: extractKeywords(
      text,
      catalog.vendorIndex,
      catalog.productTypes
    ),
  };

  
}

module.exports = parseQuery;