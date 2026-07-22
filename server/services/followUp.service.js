function detectFollowUp(text) {
  text = text.toLowerCase().trim();

  // Cheapest
  if (
    text.includes("cheapest") ||
    text.includes("lowest price") ||
    text.includes("least expensive")
  ) {
    return { type: "cheapest" };
  }

  // Most Expensive
  if (
    text.includes("most expensive") ||
    text.includes("highest price") ||
    text.includes("costliest")
  ) {
    return { type: "most-expensive" };
  }

	// Recommend
	if (
		text.includes("recommend") ||
		text.includes("best one") ||
		text.includes("which one should i buy") ||
		text.includes("which should i buy")
	) {
		return {
			type: "recommend",
		};
	}

  return null;
}

module.exports = detectFollowUp;