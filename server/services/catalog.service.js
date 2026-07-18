const fetchShopifyProducts = require("./shopify.service");

let catalog = null;

const STOP_WORDS = [
  "the",
  "and",
  "with",
  "for",
  "from",
  "not",
  "out",
  "stock",
  "price",
  "compare",
  "complete",
  "tracked",
  "inventory",
];
async function getCatalog() {
  // Cache
  if (catalog) {
    return catalog;
  }

  // Fetch all products
  const products = await fetchShopifyProducts({});

  const vendors = new Set();
  const productTypes = new Set();
  const tags = new Set();
  const colors = new Set();
  const words = new Set();
	const vendorIndex = {};
  const commonColors = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "pink",
    "grey",
    "gray",
    "brown",
    "beige",
    "cream",
    "purple",
    "orange",
    "navy",
    "olive",
    "gold",
    "silver",
  ];

  products.forEach((product) => {
    // Vendor
		if (product.vendor) {

			const vendor = product.vendor.toLowerCase();

			vendors.add(vendor);

			vendor.split(/[^a-z0-9]+/).forEach((word) => {

				if (
					word.length > 2 &&
					!STOP_WORDS.includes(word)
				) {

					words.add(word);

					if (!["vendor", "store", "shop"].includes(word)) {
						vendorIndex[word] = vendor;
					}

				}

			});

		}

    // Product Type
    if (product.productType) {
      const type = product.productType.toLowerCase();

      productTypes.add(type);

      type.split(/[^a-z0-9]+/).forEach((word) => {
        if (
					word.length > 2 &&
					!STOP_WORDS.includes(word)
				) {
					words.add(word);
				}
      });
    }

    // Title Words
    (product.title || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .forEach((word) => {
        if (
					word.length > 2 &&
					!STOP_WORDS.includes(word)
				) {
					words.add(word);
				}
      });

    // Tags
    (product.tags || []).forEach((tag) => {
      const t = tag.toLowerCase();

      tags.add(t);

      t.split(/[^a-z0-9]+/).forEach((word) => {
        if (
					word.length > 2 &&
					!STOP_WORDS.includes(word)
				) {
					words.add(word);
				}
      });

      if (commonColors.includes(t)) {
        colors.add(t);
      }
    });
  });

	catalog = {
		vendors: [...vendors],
		vendorIndex,
		productTypes: [...productTypes],
		tags: [...tags],
		colors: [...colors],
		words: [...words],
	};

  return catalog;
}

module.exports = getCatalog;