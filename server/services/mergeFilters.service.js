function mergeFilters(memory = {}, filters = {}) {

  // If user is browsing by sort or availability only,
  // start a fresh search (don't keep old budget, brand, etc.)
  if (
    (filters.sort || filters.availability) &&
    !filters.brand &&
    !filters.productType &&
    !filters.color &&
    filters.maxPrice === null &&
    (!filters.keywords || filters.keywords.length === 0)
  ) {
    return {
      brand: "",
      productType: "",
      color: "",
      maxPrice: null,

      sort: filters.sort || "",
      availability: filters.availability || "",

      keywords: [],
      page: 1,
      limit: 5,
      lastResults: [],
    };
  }

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