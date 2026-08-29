const getCatalog = require("./catalog.service");
const normalizeProductType = (value = "") =>
  value
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function extractBrand(text, vendorIndex = {}) {

  text = text.toLowerCase();

  const words = text.split(/[\s-]+/).map(word =>
    word.replace(/[?!.,]+$/g, "")
  );

  for (const word of words) {

    if (vendorIndex[word]) {
      return vendorIndex[word];
    }

  }

  return "";

}

function extractProductType(text, productTypes = []) {
  const normalizedText = text
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // First: match actual Shopify product types dynamically
  const matchedType = productTypes.find((type) => {

    const normalizedType = normalizeProductType(type);

    if (normalizedText.includes(normalizedType)) {
      return true;
    }

    const queryWords = normalizedText
      .split(" ")
      .filter(Boolean);

    const typeWords = normalizedType
      .split(" ")
      .filter(Boolean);

    return typeWords.every(typeWord =>
      queryWords.some(queryWord =>
        queryWord === typeWord ||
        queryWord.startsWith(typeWord) ||
        typeWord.startsWith(queryWord)
      )
    );
  });
  

  if (matchedType) {
    return matchedType;
  }

  // Common language variations
  const aliases = {
    shoes: [
      "shoe",
      "shoes",
      "sneaker",
      "sneakers",
      "running shoe",
      "running shoes",
    ],

    "t-shirt": [
      "shirt",
      "shirts",
      "t shirt",
      "t shirts",
      "tshirt",
      "tshirts",
      "tee",
      "tees",
    ],

    hoodie: [
      "hoodie",
      "hoodies",
    ],
  };

  for (const [productType, words] of Object.entries(aliases)) {
    if (
      words.some((word) => {
        const normalizedWord = word
          .toLowerCase()
          .replace(/[-_]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        return normalizedText.includes(normalizedWord);
      })
    ) {
      return productType;
    }
  }

  return "";
}

function extractColor(text) {
  const colors = [
    "black",
    "white",

    "blue",
    "navy",
    "sky blue",
    "light blue",
    "dark blue",

    "red",
    "maroon",
    "burgundy",

    "green",
    "olive",
    "lime",

    "yellow",
    "gold",
    "mustard",

    "orange",
    "peach",

    "purple",
    "violet",
    "lavender",

    "pink",
    "hot pink",

    "brown",
    "tan",
    "beige",
    "cream",

    "grey",
    "gray",
    "silver",
    "charcoal",

    "multicolor",
    "multi color",

    "cyan",
    "teal",
    "turquoise",

    "magenta",

    "khaki",
    "coffee",
    "ivory",
    "mint",
  ];

  return colors.find((c) =>
    text.toLowerCase().includes(c.toLowerCase())
  ) || "";
}

function extractSize(text) {
  const sizes = [
    "xs",
    "s",
    "m",
    "l",
    "xl",
    "xxl",
    "xxxl",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  return sizes.find(size =>
    text.toLowerCase().includes(size)
  ) || "";
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
    text.includes("cheap") ||
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

  "show",
  "me",
  "want",
  "something",   
  "need", 
  "are",
  "any",

  // Conversation words
  "what",
  "about",
 
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
      if (
        brand &&
        brand.includes(word.replace(/[?!.,]+$/g, ""))
      ) {
        return false;
      }

      // Remove product type words
      if (productType) {
        const productTypeWords = normalizeProductType(productType)
          .split(" ")
          .filter(Boolean);

        const normalizedWord = normalizeProductType(word);

        if (
          productTypeWords.some(typeWord =>
            typeWord === normalizedWord ||
            typeWord.startsWith(normalizedWord) ||
            normalizedWord.startsWith(typeWord)
          )
        ) {
          return false;
        }
      }

      if (word === color) return false;
      if (!isNaN(word)) return false;

      // Remove price values like $80, ₹500, £50, €100
      //if (/^[$₹£€]?\d+$/.test(word)) return false;
      if (/^[$₹£€]?\d+[?!.,]*$/.test(word)) return false;

      return true;

    });
}

async function parseQuery(text = "") {
  text = text.toLowerCase();

  const catalog = await getCatalog();

  const detectedProductType = extractProductType(
    text,
    catalog.productTypes
  );
  
  const extractedKeywords = extractKeywords(
    text,
    catalog.vendorIndex,
    catalog.productTypes
  );

  return {
    brand: extractBrand(text, catalog.vendorIndex),
    productType: detectedProductType,
    color: extractColor(text),
    maxPrice: extractPrice(text),
    sort: extractSort(text),
    availability: extractAvailability(text),
    keywords: extractedKeywords,
  };
}

module.exports = parseQuery;