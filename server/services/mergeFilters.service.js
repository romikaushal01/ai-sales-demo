function mergeFilters(memory = {}, filters = {}) {
  console.log("MERGE RETURN:", {
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
  page: memory.page || 1,
  limit: memory.limit || 5,
  lastResults: memory.lastResults || [],
});

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

    // Pagination
    page: memory.page || 1,
    limit: memory.limit || 5,

    // Cache last ranked results
    lastResults: memory.lastResults || [],
  };
}

module.exports = mergeFilters;