function mergeFilters(memory = {}, filters = {}) {
  
  return {
    brand: filters.brand || memory.brand || "",
    productType: filters.productType || memory.productType || "",
    color: filters.color || memory.color || "",

    maxPrice:
      filters.maxPrice !== null
        ? filters.maxPrice
        : (memory.maxPrice ?? null),

    sort: filters.sort || memory.sort || "",

    availability:
    filters.availability || memory.availability || "",

    keywords:
      (filters.keywords && filters.keywords.length)
        ? filters.keywords
        : (memory.keywords || []),

    page: memory.page || 1,
    limit: memory.limit || 5,

    lastResults: memory.lastResults || [],
  };
}

module.exports = mergeFilters;