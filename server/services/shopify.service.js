const axios = require("axios");
const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

function buildSearchQuery(filters = {}) {
  const parts = [];

  if (filters.brand) {
    parts.push(`vendor:${filters.brand}`);
  }

  if (filters.productType) {
    parts.push(`product_type:${filters.productType}`);
  }

  return parts.join(" ");
}

async function fetchShopifyProducts(filters = {}) {

  const searchQuery = buildSearchQuery(filters);

  let sortKey = "";
  let reverse = "";

  switch (filters.sort) {
    case "best-selling":
      sortKey = ", sortKey: BEST_SELLING";
      break;

    case "new":
    sortKey = ", sortKey: CREATED_AT";
    reverse = ", reverse: true";
    break;

    case "price-asc":
      sortKey = ", sortKey: PRICE";
      break;

    case "price-desc":
      sortKey = ", sortKey: PRICE";
      reverse = ", reverse: true";
      break;
  }
  
  const graphqlQuery = `
  {
    products(
      first: 30,
      query: "${searchQuery}"
      ${sortKey}
      ${reverse}
    ) {
      edges {
        node {
          title
          handle
          vendor
          onlineStoreUrl
          productType
          availableForSale
          tags
          description
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }

          variants(first: 1) {
            edges {
              node {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
  `;

  const response = await axios.post(
    `https://${SHOP}/api/2025-01/graphql.json`,
    {
      query: graphqlQuery,
    },
    {
      headers: {
        "X-Shopify-Storefront-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  // 👇 ADD THIS
  
  let products =
  
    response.data.data.products.edges.map(({ node }) => ({
      title: node.title,
      vendor: node.vendor,
      productType: node.productType,
      availableForSale: node.availableForSale,
      tags: node.tags || [],
      description: node.description || "",
      handle: node.handle,
      url:
        node.onlineStoreUrl ||
        `https://${process.env.SHOPIFY_STORE_DOMAIN}/products/${node.handle}`,
      image: node.images.edges[0]?.node.url || "",
      price: Number(
        node.variants.edges[0]?.node.price.amount || 0
      ),
    }));

  // Apply price filter
  if (typeof filters.maxPrice === "number") {
    products = products.filter(
      p => p.price <= filters.maxPrice
    );
  }


  return products;

}

module.exports = fetchShopifyProducts;