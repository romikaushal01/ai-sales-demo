function rankProducts(products, filters) {
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

        if (type.includes(filters.productType)) {
          score += 100;
        }

        if (title.includes(filters.productType)) {
          score += 70;
        }

        if (tags.includes(filters.productType)) {
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
      filters.keywords.forEach((keyword) => {

        if (title.includes(keyword)) {
          score += 80;
        }

        if (type.includes(keyword)) {
          score += 60;
        }

        if (tags.includes(keyword)) {
          score += 50;
        }

        if (description.includes(keyword)) {
          score += 30;
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

      return { ...p, score };
    })

    // STEP 1: Rank by score
    .sort((a, b) => b.score - a.score)

    // STEP 2: Keep only relevant products
    .filter(p => p.score > 20)

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