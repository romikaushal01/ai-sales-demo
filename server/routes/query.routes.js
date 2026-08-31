const express = require("express");
const router = express.Router();

const parseQuery = require("../services/queryParser.service");
const fetchShopifyProducts = require("../services/shopify.service");
const rankProducts = require("../services/ranking.service");
const getCatalog = require("../services/catalog.service");
const buildResponse = require("../services/response.service");
const {
  getMemory,
  updateMemory,
  clearMemory,
} = require("../services/memory.service");

const {
  detectConversation,
} = require("../services/conversation.service");

const mergeFilters = require("../services/mergeFilters.service");

const detectFollowUp = require("../services/followUp.service");

const {
  createCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartLine,
  getCart,
} = require("../services/cart.service");

const {
  trackEvent,
} = require("../analytics/analytics.service");

const USE_AI = false;
async function addProductToCart(sessionId, memory, product) {

  let checkoutUrl;

  if (memory.cartId) {

    const cart = await addToCart(
      memory.cartId,
      product.variantId
    );

    checkoutUrl = cart.cart.checkoutUrl;

  } else {

    const cart = await createCart(product.variantId);

    updateMemory(sessionId, {
      cartId: cart.cart.id,
      checkoutUrl: cart.cart.checkoutUrl,
    });

    checkoutUrl = cart.cart.checkoutUrl;
  }

  updateMemory(sessionId, {
    lastAdded: product,
  });

  return checkoutUrl;
}

router.post("/", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (USE_AI) {

      // ======================================
      // FUTURE OPENAI LOGIC
      // ======================================

      return res.json({
        reply: "AI mode is not implemented yet.",
        products: [],
      });

    } else {

      // ======================================
      // CURRENT SHOPIFY SEARCH LOGIC
      // ======================================

      const text = (message || "").toLowerCase().trim();

      const conversation = detectConversation(text);

      let memory = getMemory(sessionId);

      const followUp = detectFollowUp(text);

      // Follow-up questions
      if (followUp && memory.lastResults?.length) {

        // Cheapest
        if (followUp.type === "cheapest") {

          const cheapest = [...memory.lastResults].sort(
            (a, b) => Number(a.price) - Number(b.price)
          )[0];

          return res.json({
            reply: `💰 The cheapest option is ${cheapest.title}.`,
            products: [cheapest],
            suggestions: [],
            hasMore: false,
          });
        }

        // Most Expensive
        if (followUp.type === "most-expensive") {

          const expensive = [...memory.lastResults].sort(
            (a, b) => Number(b.price) - Number(a.price)
          )[0];

          return res.json({
            reply: `💎 The most expensive option is ${expensive.title}.`,
            products: [expensive],
            suggestions: [],
            hasMore: false,
          });
        }

        // Recommend
        if (followUp.type === "recommend") {

          let recommended = memory.lastResults[0];

          // Prefer exact brand match
          if (memory.brand) {

            const exactBrand = memory.lastResults.find(
              p =>
                p.vendor &&
                p.vendor.toLowerCase().includes(
                  memory.brand.toLowerCase()
                )
            );

            if (exactBrand) {
              recommended = exactBrand;
            }

          }

          trackEvent({
            event: "RECOMMEND_PRODUCT",
            sessionId,
            productTitle: recommended.title,
            productPrice: recommended.price,
            productVendor: recommended.vendor,
            productType: recommended.productType,
          });

          return res.json({
            reply: `⭐ My recommendation is ${recommended.title}. It's one of the best matches based on what you're looking for.`,
            products: [recommended],
            suggestions: [],
            hasMore: false,
          });
        }

        // Compare Products
        if (followUp.type === "compare") {

          if (!memory.lastResults || memory.lastResults.length < 2) {
            return res.json({
              reply: "I need at least two products to compare. 😊",
              products: memory.lastResults || [],
              suggestions: [],
              hasMore: false,
            });
          }

          const first = memory.lastResults[0];
          const second = memory.lastResults[1];

          updateMemory(sessionId, {
            lastCompared: [first, second],
          });

          return res.json({
            reply: `📊 Product Comparison

            🥇 ${first.title}
            💲 Price: $${first.price}
            🏷 Brand: ${first.vendor}

            🆚

            🥈 ${second.title}
            💲 Price: $${second.price}
            🏷 Brand: ${second.vendor}

            💡 Recommendation

            💰 ${first.title} offers better value for money.
            ✨ ${second.title} is the more premium option.`,
            
                products: [first, second],
                messageType: "comparison",
                suggestions: [],
                hasMore: false,
          });
        }

        // Product Details
        if (followUp.type === "details") {

          if (!memory.lastResults || memory.lastResults.length === 0) {
            return res.json({
              reply: "I couldn't find any previous products.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          let product = memory.lastResults[0];

          // User asked about second product
          if (text.includes("second")) {
            product = memory.lastResults[1] || product;
          }

          const category = product.productType
            ? product.productType
                .split(" ")
                .map(
                  word =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
                )
                .join(" ")
            : "N/A";
          updateMemory(sessionId, {
            lastViewed: product,
          });
          return res.json({
            reply: `📦 ${product.title}

        💲 Price: $${product.price}

        🏷 Brand: ${product.vendor}

        📂 Category: ${category}

        ${product.availableForSale ? "✅ In Stock" : "❌ Out of Stock"}

        📝 Description

        ${product.description || "Product details are currently unavailable."}`,

            products: [product],
            messageType: "details",
            suggestions: [],
            hasMore: false,
          });

        }

        // Better Products
        if (followUp.type === "better-product") {

          if (!memory.lastCompared || memory.lastCompared.length < 2) {
            return res.json({
              reply: "Please compare two products first.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const first = memory.lastCompared[0];
          const second = memory.lastCompared[1];

          const price1 = Number(first.price);
          const price2 = Number(second.price);

          const cheaper = price1 <= price2 ? first : second;
          const premium = price1 > price2 ? first : second;

          const difference = Math.abs(price1 - price2);

          let reply;

          if (difference < 10) {
            reply = `⭐ I'd recommend ${premium.title}.

            For just $${difference} more, it's the more premium option and offers better overall value.

            💰 ${cheaper.title} is still a great budget-friendly choice.

            👉 You can simply say "Buy it" to purchase my recommended product.`;

          } else {
            reply = `⭐ I'd recommend ${cheaper.title}.

              It offers significantly better value for money.

              If you don't mind spending $${difference} extra, ${premium.title} is the more premium option.

              👉 You can simply say "Buy it" to purchase my recommended product.`;
          }
          const recommended =
          difference < 10 ? premium : cheaper;

          updateMemory(sessionId, {
            lastRecommended: recommended,
          });

          trackEvent({
            event: "RECOMMEND_PRODUCT",
            sessionId,
            productTitle: recommended.title,
            productPrice: recommended.price,
            comparedProducts: [
              first.title,
              second.title,
            ],
            recommendationType: "better-product",
          });

          return res.json({
            reply,
            products: [recommended],
            suggestions: [
              "Buy it",
              "Show details",
              "Compare again",
            ],
            hasMore: false,
          });
        }

        // Color Filter
        if (followUp.type === "color-filter") {

          if (!memory.lastResults || memory.lastResults.length === 0) {
            return res.json({
              reply: "Please search for products first.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }
          memory.originalResults.forEach(product => {
          });
          const filtered = memory.originalResults.filter(product =>
            product.colors?.includes(followUp.color)
          );

          if (!filtered.length) {
            return res.json({
              reply: `🎨 Here ${filtered.length > 1 ? "are" : "is"} ${filtered.length} ${followUp.color} product${filtered.length > 1 ? "s" : ""}.`,
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          // Update memory with filtered results
          // updateMemory(sessionId, {
          //   ...memory,
          //   lastResults: filtered,
          // });

          updateMemory(sessionId, {
            ...memory,
            color: followUp.color,
            lastResults: filtered,
          });

          return res.json({
            reply: `🎨 I found ${filtered.length} ${followUp.color} product${filtered.length > 1 ? "s" : ""}.`,
            products: filtered.slice(0, 5),
            suggestions: [],
            hasMore: filtered.length > 5,
          });

        }

        // Size Filter
        if (followUp.type === "size-filter") {

          if (!memory.lastResults || memory.lastResults.length === 0) {
          return res.json({
          reply: "Please search for products first.",
          products: [],
          suggestions: [],
          hasMore: false,
          });
          }

          memory.originalResults.forEach(product => {});

          const filtered = memory.originalResults.filter(product =>
          product.sizes?.includes(followUp.size)
          );

          if (!filtered.length) {

          // 🔍 Search the entire store
          const freshProducts = await fetchShopifyProducts({
          page: 1,
          limit: 250,
          });

          const sizeResults = freshProducts.filter(product =>
          product.sizes?.includes(followUp.size)
          );

          updateMemory(sessionId, {
          ...memory,
          originalResults: sizeResults,
          lastResults: sizeResults,
          });

          return res.json({
          reply: sizeResults.length
          ? `📏 I couldn't find Size ${followUp.size.toUpperCase()} in the previous results, so I searched the full catalog and found ${sizeResults.length} product${sizeResults.length > 1 ? "s" : ""} in Size ${followUp.size.toUpperCase()}.`
          : `😕 I couldn't find any products in Size ${followUp.size.toUpperCase()} in the store.`,
          products: sizeResults.slice(0, 5),
          suggestions: [],
          hasMore: sizeResults.length > 5,
          });
          }

          updateMemory(sessionId, {
          ...memory,
          lastResults: filtered,
          });

          return res.json({
          reply: `📏 I found ${filtered.length} product${filtered.length > 1 ? "s" : ""} in size ${followUp.size.toUpperCase()}.`,
          products: filtered.slice(0, 5),
          suggestions: [],
          hasMore: filtered.length > 5,
          });
        }
      
        // Add to Cart
        if (followUp.type === "add-to-cart") {

          if (!memory.lastResults || memory.lastResults.length === 0) {
            return res.json({
              reply: "Please search for a product first.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const product = memory.lastResults[followUp.index];
          if (!product) {
            return res.json({
              reply: "I couldn't find that product.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const checkoutUrl = await addProductToCart(
            sessionId,
            memory,
            product
          );

          // Track Add To Cart
          trackEvent({
            event: "ADD_TO_CART",
            sessionId,
            productTitle: product.title,
            productPrice: product.price,
            productVendor: product.vendor,
            productType: product.productType,
          });

          return res.json({
            reply: `🛒 ${product.title} has been added to your cart.`,
            products: [product],
            checkoutUrl,
            suggestions: [],
            hasMore: false,
          });
        }

        // Show Cart
        if (followUp.type === "show-cart") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          if (cart.lines.edges.length === 0) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              items: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const items = cart.lines.edges.map(({ node }) => ({
            title: node.merchandise.product.title,
            variant: node.merchandise.title,
            quantity: node.quantity,
            price: node.merchandise.price.amount,
            currency: node.merchandise.price.currencyCode,
            image: node.merchandise.image?.url,
          }));
           
          const totalItems = items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          
          const reply = `🛒 You have ${totalItems} item${totalItems > 1 ? "s" : ""} in your cart.`;

          return res.json({
            reply,
            items,
            subtotal: cart.cost.subtotalAmount,
            total: cart.cost.totalAmount,
            checkoutUrl: cart.checkoutUrl,
            suggestions: [],
            hasMore: false,
          });
        }

        // Remove from Cart
        if (followUp.type === "remove-from-cart") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          const line = cart.lines.edges[followUp.index];

          if (!line) {
            return res.json({
              reply: "I couldn't find that item in your cart.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const removed = await removeFromCart(
            memory.cartId,
            line.node.id
          );

          return res.json({
            reply: `🗑️ ${line.node.merchandise.product.title} has been removed from your cart.`,
            checkoutUrl: removed.cart.checkoutUrl,
            suggestions: [],
            hasMore: false,
          });
        }

        // Clear Cart
        if (followUp.type === "clear-cart") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is already empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          if (cart.lines.edges.length === 0) {
            return res.json({
              reply: "🛒 Your cart is already empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          await clearCart(memory.cartId);

          return res.json({
            reply: "🗑️ Your cart has been cleared.",
            suggestions: [],
            hasMore: false,
          });
        }

        // Increase Quantity
        if (followUp.type === "increase-quantity") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          const line = cart.lines.edges[followUp.index];

          if (!line) {
            return res.json({
              reply: "I couldn't find that item in your cart.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const updated = await updateCartLine(
            memory.cartId,
            line.node.id,
            line.node.quantity + 1
          );

          return res.json({
            reply: `✅ ${line.node.merchandise.product.title} quantity increased to ${line.node.quantity + 1}.`,
            checkoutUrl: updated.cart.checkoutUrl,
            suggestions: [],
            hasMore: false,
          });
        }

        // Decrease Quantity
        if (followUp.type === "decrease-quantity") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          const line = cart.lines.edges[followUp.index];

          if (!line) {
            return res.json({
              reply: "I couldn't find that item in your cart.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          // If quantity is 1, remove item instead
          if (line.node.quantity === 1) {

            const removed = await removeFromCart(
              memory.cartId,
              line.node.id
            );

            return res.json({
              reply: `🗑️ ${line.node.merchandise.product.title} has been removed from your cart.`,
              checkoutUrl: removed.cart.checkoutUrl,
              suggestions: [],
              hasMore: false,
            });
          }

          // Otherwise decrease quantity
          const updated = await updateCartLine(
            memory.cartId,
            line.node.id,
            line.node.quantity - 1
          );

          return res.json({
            reply: `✅ ${line.node.merchandise.product.title} quantity decreased to ${line.node.quantity - 1}.`,
            checkoutUrl: updated.cart.checkoutUrl,
            suggestions: [],
            hasMore: false,
          });
        }

        // Set Quantity
        if (followUp.type === "set-quantity") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          const line = cart.lines.edges[followUp.index];

          if (!line) {
            return res.json({
              reply: "I couldn't find that item in your cart.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const updated = await updateCartLine(
            memory.cartId,
            line.node.id,
            followUp.quantity
          );

          return res.json({
            reply: `✅ ${line.node.merchandise.product.title} quantity updated to ${followUp.quantity}.`,
            checkoutUrl: updated.cart.checkoutUrl,
            suggestions: [],
            hasMore: false,
          });
        }

        // Checkout
        if (followUp.type === "checkout") {

          if (!memory.cartId) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const cart = await getCart(memory.cartId);

          if (cart.lines.edges.length === 0) {
            return res.json({
              reply: "🛒 Your cart is empty.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

           // ✅ Track Checkout Click
           trackEvent({
             event: "CHECKOUT_CLICK",
             sessionId,
             cartId: memory.cartId,
             items: cart.lines.edges.length,
             checkoutUrl: cart.checkoutUrl,
           });

          return res.json({
            reply: "🛍️ You're all set! Click below to complete your purchase.",
            checkoutUrl: cart.checkoutUrl,
            messageType: "checkout",
            suggestions: [],
            hasMore: false,
          });
        }
        
        // Add Cheaper Products
        if (followUp.type === "add-cheaper") {

        if (
          !memory.lastCompared ||
          memory.lastCompared.length < 2
        ) {
          return res.json({
            reply: "Please compare two products first.",
            products: [],
            suggestions: [],
            hasMore: false,
          });
        }

        const first = memory.lastCompared[0];
        const second = memory.lastCompared[1];

        const cheaper =
          Number(first.price) <= Number(second.price)
            ? first
            : second;

        const checkoutUrl = await addProductToCart(
          sessionId,
          memory,
          cheaper
        );

        return res.json({
          reply: `🛒 ${cheaper.title} has been added to your cart.`,
          products: [cheaper],
          checkoutUrl,
          suggestions: [
            "Show cart",
            "Checkout",
          ],
          hasMore: false,
        });
        }

        // Add Premium Products
        if (followUp.type === "add-premium") {

          if (
            !memory.lastCompared ||
            memory.lastCompared.length < 2
          ) {
            return res.json({
              reply: "Please compare two products first.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const first = memory.lastCompared[0];
          const second = memory.lastCompared[1];

          const premium =
            Number(first.price) >= Number(second.price)
              ? first
              : second;

          const checkoutUrl = await addProductToCart(
            sessionId,
            memory,
            premium
          );

          return res.json({
            reply: `🛒 ${premium.title} has been added to your cart.`,
            products: [premium],
            checkoutUrl,
            suggestions: [
              "Show cart",
              "Checkout",
            ],
            hasMore: false,
          });
        }

        // Buy Recommended Product
        if (followUp.type === "buy-recommended") {

          if (!memory.lastRecommended) {
            return res.json({
              reply: "Please ask me for a recommendation first.",
              products: [],
              suggestions: [],
              hasMore: false,
            });
          }

          const product = memory.lastRecommended;

          const checkoutUrl = await addProductToCart(
            sessionId,
            memory,
            product
          );
    
          trackEvent({
            event: "ADD_TO_CART",
            sessionId,
            productTitle: product.title,
            productPrice: product.price,
            productVendor: product.vendor,
            productType: product.productType,
          });

          return res.json({
            reply: `🛒 ${product.title} has been added to your cart.`,
            products: [product],
            checkoutUrl,
            suggestions: [
              "Show cart",
              "Checkout",              
            ],
            hasMore: false,
          });
        }

      }

      // User said YES
      if (
        conversation &&
        conversation.type === "yes" &&
        memory.pendingAction === "show-best-sellers"
      ) {

        clearMemory(sessionId);

        const filters = {
          brand: "",
          productType: "",
          color: "",
          maxPrice: null,
          availability: "",
          sort: "best-selling",
          keywords: [],
          page: 1,
          limit: 5,
        };

        const products = await fetchShopifyProducts(filters);

        const paginated = products.slice(0, filters.limit);

        updateMemory(sessionId, {
          ...filters,
          originalResults: products,
          lastResults: products,
        });

        return res.json(
          buildResponse(filters, paginated, products.length, false)
        );
      }

      if (conversation && conversation.reply) {
        return res.json({
          reply: conversation.reply,
          products: [],
          suggestions: [],
          hasMore: false,
        });
      }

      await getCatalog();

      // Parse query
      const filters = await parseQuery(message);

      // Show more request
      const isShowMore = [
        "show more",
        "more",
        "next",
      ].includes(text);

      // NEW SEARCH?
      if (
        !isShowMore &&
        !followUp &&
        (
          filters.brand ||
          filters.productType ||
          filters.keywords.length > 0
        )
      ) {
        const oldMemory = getMemory(sessionId);

        clearMemory(sessionId);

        updateMemory(sessionId, {
          cartId: oldMemory.cartId,
          checkoutUrl: oldMemory.checkoutUrl,
        });

        // Reload memory
        memory = getMemory(sessionId);
        
      }

      // Increase page for "show more"
      if (isShowMore) {
        memory.page = (memory.page || 1) + 1;
      }

      // ✅ Merge
      const mergedFilters = mergeFilters(memory, filters);

      updateMemory(sessionId, mergedFilters);

      // Use cached results for "show more"
      if (isShowMore && memory.lastResults.length) {

        const start = (mergedFilters.page - 1) * mergedFilters.limit;
        const end = start + mergedFilters.limit;

        const paginated = memory.lastResults.slice(start, end);

        return res.json(
          buildResponse(
            mergedFilters,
            paginated,
            memory.lastResults.length,
            true
          )
        );
      }

      // Fetch products
      let products = await fetchShopifyProducts(mergedFilters);

      // Don't fallback for strict filters like budget
      if (
        !products.length &&
        !mergedFilters.maxPrice &&
        !mergedFilters.availability &&
        !mergedFilters.brand
      ) {

        // Fallback 1
        products = await fetchShopifyProducts({
          ...mergedFilters,
          brand: "",
        });

        // Fallback 2
        if (!products.length) {
          products = await fetchShopifyProducts({
            ...mergedFilters,
            brand: "",
            //productType: "",
          });
        }
      }

      // Rank
      const ranked =
      mergedFilters.sort &&
      !mergedFilters.brand &&
      !mergedFilters.productType &&
      (!mergedFilters.keywords || mergedFilters.keywords.length === 0)
        ? products
        : rankProducts(products, mergedFilters);

      // Pagination
      const start = (mergedFilters.page - 1) * mergedFilters.limit;
      const end = start + mergedFilters.limit;

      const paginated = ranked.slice(start, end);

      // Save ranked results in memory
      const response = buildResponse(
        mergedFilters,
        paginated,
        ranked.length,
        false
      );

      // ✅ Track Search Event
      if (
        !followUp &&
        !isShowMore &&
        mergedFilters.page === 1
      ) {
        trackEvent({
          event: "SEARCH_PRODUCT",
          sessionId,
          query: text,
          results: ranked.length,
          brand: mergedFilters.brand,
          category: mergedFilters.productType,
          color: mergedFilters.color,
          page: mergedFilters.page,
          success: ranked.length > 0,
          sort: mergedFilters.sort || "",
          maxPrice: mergedFilters.maxPrice ?? null,
        });
      }

     // ✅ Save AFTER buildResponse
      updateMemory(sessionId, {
        ...mergedFilters,
        originalResults: ranked,
        lastResults: ranked,
        pendingAction: response.pendingAction || "",
      });

      return res.json(response);

    }

  } catch (err) {
    console.log(err);

    return res.json({
      reply: "Something went wrong.",
      products: [],
    });
  }
});

module.exports = router;

