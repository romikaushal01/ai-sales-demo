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

  // Color Filter
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

  const selectedColor = colors.find(color =>
    text.toLowerCase().includes(color.toLowerCase())
  );

  if (
    selectedColor &&
    (
      text.startsWith("only") ||
      text.includes("show only") ||
      text.includes("filter")
    )
  ) {
    return {
      type: "color-filter",
      color: selectedColor,
    };
  }

  // Size Filter
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

  const words = text.toLowerCase().split(/\s+/);

  const selectedSize = sizes.find(size =>
    words.includes(size)
  );

  if (
    selectedSize &&
    (
      text.includes("size") ||
      text.startsWith("only") ||
      text.includes("show only")
    )
  ) {
    return {
      type: "size-filter",
      size: selectedSize,
    };
  }

  // Product Details
  if (
    text.includes("tell me more") ||
    text.includes("more about") ||
    text.includes("details") ||
    text.includes("first one") ||
    text.includes("second one")
  ) {
    return {
      type: "details",
    };
  }

  // Compare Products
  if (
    text.includes("compare") ||
    text.includes("compare first two") ||
    text.includes("compare first and second") ||
    text.includes("compare the first two")
  ) {
    return {
      type: "compare",
    };
  }

  return null;
}

module.exports = detectFollowUp;