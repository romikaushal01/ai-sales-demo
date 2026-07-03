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
      if (filters.maxPrice && p.price <= filters.maxPrice) {
        score += 50;
      }

      return { ...p, score };
    })

    // 🔥 STEP 1: SORT FIRST
    .sort((a, b) => b.score - a.score)

    // 🔥 STEP 2: FILTER AFTER SORT (IMPORTANT)
    .filter(p => p.score > 20);
}

module.exports = rankProducts;