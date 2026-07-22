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


const USE_AI = false;

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

      const memory = getMemory(sessionId);

      const followUp = detectFollowUp(text);

      console.log("FOLLOW UP:", followUp);

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
        (
          filters.brand ||
          filters.productType ||
          (
            filters.keywords.length > 0 &&
            !filters.brand &&
            !filters.productType
          )
        )
      ) {
        clearMemory(sessionId);
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
        !mergedFilters.availability
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
            productType: "",
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

      // ✅ Save AFTER buildResponse
      updateMemory(sessionId, {
        ...mergedFilters,
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

