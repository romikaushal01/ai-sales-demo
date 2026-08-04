const axios = require("axios");

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

async function createCart(variantId, quantity = 1) {
  const query = `
    mutation cartCreate($lines: [CartLineInput!]) {
      cartCreate(input: {
        lines: $lines
      }) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    lines: [
      {
        merchandiseId: variantId,
        quantity,
      },
    ],
  };

  const response = await axios.post(
    `https://${SHOP}/api/2025-01/graphql.json`,
    {
      query,
      variables,
    },
    {
      headers: {
        "X-Shopify-Storefront-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.cartCreate;
}

async function addToCart(cartId, variantId, quantity = 1) {

  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [
      {
        merchandiseId: variantId,
        quantity,
      },
    ],
  };

  const response = await axios.post(
    `https://${SHOP}/api/2025-01/graphql.json`,
    {
      query,
      variables,
    },
    {
      headers: {
        "X-Shopify-Storefront-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.cartLinesAdd;
}

async function removeFromCart(cartId, lineId) {

  const query = `
    mutation cartLinesRemove(
      $cartId: ID!,
      $lineIds: [ID!]!
    ) {
      cartLinesRemove(
        cartId: $cartId,
        lineIds: $lineIds
      ) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await axios.post(
    `https://${SHOP}/api/2025-01/graphql.json`,
    {
      query,
      variables: {
        cartId,
        lineIds: [lineId],
      },
    },
    {
      headers: {
        "X-Shopify-Storefront-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.cartLinesRemove;
}

async function getCart(cartId) {

  const query = `
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 20) {
          edges {
            node {
              id
              quantity

              merchandise {
                ... on ProductVariant {
                  id
                  title

                  product {
                    title
                  }

                  image {
                    url
                  }

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
      query,
      variables: {
        cartId,
      },
    },
    {
      headers: {
        "X-Shopify-Storefront-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.cart;
}

module.exports = {
  createCart,
  addToCart,
  removeFromCart,
  getCart,
};