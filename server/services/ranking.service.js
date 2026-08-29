const normalizeProductType = (value = "") =>
  value
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function productTypeMatches(queryType, actualType) {
  const queryWords = normalizeProductType(queryType)
    .split(" ")
    .filter(Boolean);

  const actualWords = normalizeProductType(actualType)
    .split(" ")
    .filter(Boolean);

  if (!queryWords.length || !actualWords.length) {
    return false;
  }

  // Every query word must match an actual product-type word
  return queryWords.every(queryWord =>
    actualWords.some(actualWord =>
      actualWord === queryWord ||
      actualWord.startsWith(queryWord) ||
      queryWord.startsWith(actualWord)
    )
  );
}

function rankProducts(products, filters) {

  // Only availability filter (no search query)
const onlyAvailability =
  filters.availability &&
  !filters.brand &&
  !filters.productType &&
  !filters.color &&
  filters.maxPrice === null &&
  (!filters.keywords || filters.keywords.length === 0);

if (onlyAvailability) {
  return products.filter(p =>
    filters.availability === "in-stock"
      ? p.availableForSale
      : !p.availableForSale
  );
}
  return products
    .map(p => {
      let score = 0;

      const title = (p.title || "").toLowerCase();
      const type = (p.productType || "").toLowerCase();
      const vendor = (p.vendor || "").toLowerCase();

      const tags = (p.tags || []).join(" ").toLowerCase();
      const description = (p.description || "").toLowerCase();      
      
      if (filters.brand && vendor.includes(filters.brand)) {
        score += 120;
      }

      // Product Type
      if (filters.productType) {

        const normalizedFilterType =
          normalizeProductType(filters.productType);

        if (productTypeMatches(normalizedFilterType, type)) {
          score += 100;
        }

        if (normalizeProductType(title).includes(normalizedFilterType)) {
          score += 70;
        }

        if (normalizeProductType(tags).includes(normalizedFilterType)) {
          score += 50;
        }

      }

      // Color (future use)
      if (filters.color) {

        if (title.includes(filters.color))
          score += 40;

        if (tags.includes(filters.color))
          score += 30;

        if (description.includes(filters.color))
          score += 20;

      }
      // Keywords
      let keywordMatch = false;

      filters.keywords.forEach((keyword) => {

        const normalizedKeyword =
          normalizeProductType(keyword);

        const normalizedTitle =
          normalizeProductType(title);

        const normalizedType =
          normalizeProductType(type);

        const normalizedTags =
          normalizeProductType(tags);

        const normalizedDescription =
          normalizeProductType(description);

        if (normalizedTitle.split(" ").some(word =>
          word === normalizedKeyword ||
          word.startsWith(normalizedKeyword) ||
          normalizedKeyword.startsWith(word)
        )) {
          score += 80;
          keywordMatch = true;
        }

        if (normalizedType.split(" ").some(word =>
          word === normalizedKeyword ||
          word.startsWith(normalizedKeyword) ||
          normalizedKeyword.startsWith(word)
        )) {
          score += 60;
          keywordMatch = true;
        }

        if (normalizedTags.split(" ").some(word =>
          word === normalizedKeyword ||
          word.startsWith(normalizedKeyword) ||
          normalizedKeyword.startsWith(word)
        )) {
          score += 50;
          keywordMatch = true;
        }

        if (normalizedDescription.split(" ").some(word =>
          word === normalizedKeyword ||
          word.startsWith(normalizedKeyword) ||
          normalizedKeyword.startsWith(word)
        )) {
          score += 30;
          keywordMatch = true;
        }

      });

      // Price
      if (filters.maxPrice) {

        // Reject products over budget
        if (p.price > filters.maxPrice) {
          score = -999;
        } else {
          score += 50;
        }

      }

      // Availability
      if (filters.availability === "in-stock") {

        if (!p.availableForSale) {
          score = -999;
        }

      }

      if (filters.availability === "out-of-stock") {

        if (p.availableForSale) {
          score = -999;
        }

      }

      return { ...p, score, keywordMatch };
    })

    // STEP 1: Rank by score
    .sort((a, b) => b.score - a.score)

    // STEP 2: Keep only relevant products
    .filter(p => {

        const onlySorting =
          filters.sort &&
          !filters.brand &&
          !filters.productType &&
          !filters.color &&
          !filters.maxPrice &&
          !filters.availability &&
          filters.keywords.length === 0;

        if (onlySorting) {
          return true;
        }

        if (filters.keywords?.length > 0 && !p.keywordMatch) {
          return false;
        }

        return p.score > 20;

      })

    // STEP 3: Apply user sorting
    .sort((a, b) => {

      if (filters.sort === "price-asc") {
        return a.price - b.price;
      }

      if (filters.sort === "price-desc") {
        return b.price - a.price;
      }

      // Default: keep ranking order
      return 0;
    });
}

module.exports = rankProducts;