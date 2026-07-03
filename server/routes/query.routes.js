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

const mergeFilters = require("../services/mergeFilters.service");


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

      // Greeting
      if (["hi", "hello", "hey"].includes(text)) {
        return res.json({
          reply: "Hi 👋 What product are you looking for today?",
          products: [],
        });
      }

      await getCatalog();

      // Parse query
      const filters = await parseQuery(message);

      // NEW SEARCH?
      if (
        filters.brand ||
        filters.productType ||
        (
          filters.keywords.length > 0 &&
          !filters.brand &&
          !filters.productType
        )
      ) {
        clearMemory(sessionId);
      }

      // Read memory AFTER clearing
      const memory = getMemory(sessionId);

      // ✅ Merge
      const mergedFilters = mergeFilters(memory, filters);

      updateMemory(sessionId, mergedFilters);

      console.log("MEMORY:", memory);
      console.log("MERGED FILTERS:", mergedFilters);

      // Fetch products
      let products = await fetchShopifyProducts(mergedFilters);

      // Fallback 1
      if (!products.length) {
        products = await fetchShopifyProducts({
          ...mergedFilters,
          brand: "",
        });
      }

      // Fallback 2
      if (!products.length) {
        products = await fetchShopifyProducts({
          brand: "",
          category: "",
        });
      }

      // Rank
      const ranked = rankProducts(products, mergedFilters)

      return res.json(
        buildResponse(mergedFilters, ranked)
      );

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

