function mergeFilters(memory = {}, filters = {}) {
  return {
    brand: filters.brand || memory.brand || "",
    productType: filters.productType || memory.productType || "",
    color: filters.color || memory.color || "",
    maxPrice:
      filters.maxPrice !== null
        ? filters.maxPrice
        : (memory.maxPrice ?? null),
    keywords:
      (filters.keywords && filters.keywords.length)
        ? filters.keywords
        : (memory.keywords || []),
  };
}

module.exports = mergeFilters;