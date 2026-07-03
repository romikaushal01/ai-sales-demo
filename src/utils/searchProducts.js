export const searchProducts = (
  allProducts,
  userText
) => {

const searchTerm = userText
    function normalizeText(text) {
      return text.toLowerCase().trim();
    }  

  const budgetMatch = userText.match(/\$?(\d+)/);
  const budget = budgetMatch
    ? parseInt(budgetMatch[1])
    : null;

  const searchWords = userText
    .replace(/\$?\d+/g, "")
    .replaceAll("shoes", "shoe")
    .replaceAll("shirts", "shirt")
    .replace("under", "")
    .replace("need", "")
    .replace("want", "")
    .trim()
    .split(" ")
    .filter(word => word.length > 0);

  return allProducts.filter((product) => {

    const searchableText = normalizeText(`
      ${title}
      ${category}
      ${color}
      ${brand}
    `);

    const keywordMatch =
    searchWords.length === 0 ||
    searchWords.every(word =>
        searchableText.includes(word)
    );

    const budgetFilter =
      budget === null ||
      product.price <= budget;

    return keywordMatch && budgetFilter;

  });
};