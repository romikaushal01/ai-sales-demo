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

  // Search by keywords if no productType detected
  if (
    filters.keywords &&
    filters.keywords.length > 0 &&
    !filters.productType
  ) {
    parts.push(filters.keywords.join(" "));
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

          variants(first: 20) {
            edges {
              node {
                id

                price {
                  amount
                  currencyCode
                }

                selectedOptions {
                  name
                  value
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
  
  let products = response.data.data.products.edges.map(({ node }) => {

    return {
      title: node.title,
      vendor: node.vendor,
      productType: node.productType,
      variantId: node.variants.edges[0]?.node.id,
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

      colors: node.variants.edges.flatMap(({ node: variant }) =>
        variant.selectedOptions
          .filter(option => option.name.toLowerCase() === "color")
          .map(option => option.value.toLowerCase())
      ),

      sizes: node.variants.edges
      .flatMap(({ node: variant }) =>
        variant.selectedOptions
          .filter(option =>
            ["size", "shoe size"].includes(option.name.toLowerCase())
          )
          .map(option => option.value.toLowerCase())
      ),
    };

  });

  // Strict keyword filtering
  if (
    filters.keywords &&
    filters.keywords.length > 0
  ) {
    products = products.filter((product) => {
      const searchableText = [
        product.title,
        product.productType,
        product.vendor,
        product.description,
        ...(product.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return filters.keywords.every((keyword) =>
        searchableText.includes(keyword.toLowerCase())
      );
    });
  } 

  // Apply price filter
  if (typeof filters.maxPrice === "number") {
    products = products.filter(
      p => p.price <= filters.maxPrice
    );
  }

  return products;

}

async function fetchAllShopifyProducts() {

  let allProducts = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {

    const after = endCursor
      ? `, after: "${endCursor}"`
      : "";

    const graphqlQuery = `
      {
        products(
          first: 100
          ${after}
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }

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

              variants(first: 20) {
                edges {
                  node {
                    id

                    price {
                      amount
                      currencyCode
                    }

                    selectedOptions {
                      name
                      value
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

    const productsConnection =
      response.data.data.products;

    const products =
      productsConnection.edges.map(({ node }) => {

        return {
          title: node.title,
          vendor: node.vendor,
          productType: node.productType,

          variantId:
            node.variants.edges[0]?.node.id,

          availableForSale:
            node.availableForSale,

          tags: node.tags || [],

          description:
            node.description || "",

          handle: node.handle,

          url:
            node.onlineStoreUrl ||
            `https://${process.env.SHOPIFY_STORE_DOMAIN}/products/${node.handle}`,

          image:
            node.images.edges[0]?.node.url || "",

          price: Number(
            node.variants.edges[0]?.node.price.amount || 0
          ),

          colors:
            node.variants.edges.flatMap(
              ({ node: variant }) =>
                variant.selectedOptions
                  .filter(
                    option =>
                      option.name.toLowerCase() === "color"
                  )
                  .map(
                    option =>
                      option.value.toLowerCase()
                  )
            ),

          sizes:
            node.variants.edges.flatMap(
              ({ node: variant }) =>
                variant.selectedOptions
                  .filter(
                    option =>
                      ["size", "shoe size"].includes(
                        option.name.toLowerCase()
                      )
                  )
                  .map(
                    option =>
                      option.value.toLowerCase()
                  )
            ),
        };

      });

    allProducts.push(...products);

    hasNextPage =
      productsConnection.pageInfo.hasNextPage;

    endCursor =
      productsConnection.pageInfo.endCursor;
  }
  

  return allProducts;
}

module.exports = fetchShopifyProducts;
module.exports.fetchAllShopifyProducts = fetchAllShopifyProducts;