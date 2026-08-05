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

  // Add to Cart
  const addToCartMatch = text.match(
    /(add|buy|purchase).*(first|second|third|1st|2nd|3rd)|^(add|buy|purchase)( this)? to cart$/
  );

  if (addToCartMatch) {

    let index = 0;

    if (
      text.includes("second") ||
      text.includes("2nd")
    ) {
      index = 1;
    }
    else if (
      text.includes("third") ||
      text.includes("3rd")
    ) {
      index = 2;
    }

    return {
      type: "add-to-cart",
      index,
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

  // Show Cart
  if (
    text === "cart" ||
    text === "show cart" ||
    text === "view cart" ||
    text === "my cart" ||
    text === "checkout" ||
    text === "open cart"
  ) {
    return {
      type: "show-cart",
    };
  }

  // Remove from Cart
  if (
    text.includes("remove") ||
    text.includes("delete") ||
    text.includes("remove from cart") ||
    text.includes("delete from cart")
  ) {

    let index = 0;

    if (text.includes("first")) index = 0;
    else if (text.includes("second")) index = 1;
    else if (text.includes("third")) index = 2;
    else if (text.includes("fourth")) index = 3;

    return {
      type: "remove-from-cart",
      index,
    };
  }

  // Increase Quantity
  if (
    text.includes("increase quantity") ||
    text.includes("increase first") ||
    text.includes("add one more") ||
    text.includes("one more")
  ) {

    let index = 0;

    if (text.includes("second")) index = 1;
    else if (text.includes("third")) index = 2;

    return {
      type: "increase-quantity",
      index,
    };
  }

  // Decrease Quantity
  if (
    text.includes("decrease quantity") ||
    text.includes("decrease first") ||
    text.includes("reduce quantity") ||
    text.includes("one less")
  ) {

    let index = 0;

    if (text.includes("second")) index = 1;
    else if (text.includes("third")) index = 2;

    return {
      type: "decrease-quantity",
      index,
    };
  }  

  // Set Quantity
  const setQuantityMatch = text.match(
    /(?:make|set|change|update)(?:\s+(?:first|second|third))?(?:\s+one)?(?:\s+quantity)?(?:\s+to)?\s+(\d+)/i
  );
  console.log("SET MATCH:", setQuantityMatch);
  if (setQuantityMatch) {

    let index = 0;

    if (text.includes("second")) index = 1;
    else if (text.includes("third")) index = 2;

    const quantity = parseInt(setQuantityMatch[1], 10);

    if (quantity > 0) {
      return {
        type: "set-quantity",
        index,
        quantity,
      };
    }
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