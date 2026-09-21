const axios = require("axios");

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

async function createCart(variantId, quantity = 1) {

  if (!variantId) {
    throw new Error("Variant ID is missing");
  }

  const query = `
    mutation cartCreate($input: CartInput) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
        warnings {
          code
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: [
        {
          merchandiseId: variantId,
          quantity,
        },
      ],
    },
  };

  try {

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

    // GraphQL level error
    if (response.data.errors) {

      throw new Error(
        response.data.errors
          .map(error => error.message)
          .join(", ")
      );
    }

    const result = response.data?.data?.cartCreate;

    if (!result) {
      throw new Error(
        "Shopify cartCreate returned no result"
      );
    }

    // Shopify userErrors
    if (result.userErrors?.length) {

      throw new Error(
        result.userErrors
          .map(error => error.message)
          .join(", ")
      );
    }

    // Shopify warnings
    if (result.warnings?.length) {
      const outOfStock = result.warnings.find(
        warning => warning.code === "MERCHANDISE_OUT_OF_STOCK"
      );

      if (outOfStock) {
        throw new Error(outOfStock.message);
      }
    }

    if (!result.cart) {
      throw new Error(
        "Shopify cart was not created"
      );
    }

    return result;

  } catch (error) {

    console.error(
      "CREATE CART ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
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

async function clearCart(cartId) {

  const cart = await getCart(cartId);

  const lineIds = cart.lines.edges.map(
    edge => edge.node.id
  );

  if (lineIds.length === 0) {
    return null;
  }

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
        lineIds,
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

async function updateCartLine(cartId, lineId, quantity) {

  const query = `
    mutation cartLinesUpdate(
      $cartId: ID!,
      $lines: [CartLineUpdateInput!]!
    ) {
      cartLinesUpdate(
        cartId: $cartId,
        lines: $lines
      ) {
        cart {
          id
          checkoutUrl
          lines(first: 20) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
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
        lines: [
          {
            id: lineId,
            quantity,
          },
        ],
      },
    },
    {
      headers: {
        "X-Shopify-Storefront-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.cartLinesUpdate;
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
  clearCart,
  updateCartLine,
  getCart,
};