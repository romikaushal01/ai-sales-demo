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

  console.log("SHOPIFY QUERY:", searchQuery || "(all products)");

  const graphqlQuery = `
  {
    products(first: 30, query: "${searchQuery}") {
      edges {
        node {
          title
          vendor
          productType
          tags

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


  let products =
  response.data.data.products.edges.map(({ node }) => ({
    title: node.title,
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags || [],
    description: node.description || "",
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

  console.log("FOUND PRODUCTS:", products.length);

  return products;

}

module.exports = fetchShopifyProducts;