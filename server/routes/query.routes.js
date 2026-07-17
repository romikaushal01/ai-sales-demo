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

      // Read memory AFTER clearing
      const memory = getMemory(sessionId);

      // Increase page for "show more"
      if (isShowMore) {
        memory.page = (memory.page || 1) + 1;
      }

      // ✅ Merge
      const mergedFilters = mergeFilters(memory, filters);

      updateMemory(sessionId, mergedFilters);

      console.log("MEMORY:", memory);
      console.log("MERGED FILTERS:", mergedFilters);

      // Use cached results for "show more"
      if (isShowMore && memory.lastResults.length) {

        const start = (mergedFilters.page - 1) * mergedFilters.limit;
        const end = start + mergedFilters.limit;

        const paginated = memory.lastResults.slice(start, end);

        console.log("SHOW MORE FROM CACHE");
        console.log("CACHE SIZE:", memory.lastResults.length);
        console.log("CACHE PAGE:", paginated.map(p => p.title));

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
      const ranked = rankProducts(products, mergedFilters);

      // Pagination
      const start = (mergedFilters.page - 1) * mergedFilters.limit;
      const end = start + mergedFilters.limit;

      const paginated = ranked.slice(start, end);

      console.log("RANKED:", ranked.length);
      console.log("PAGINATED:", paginated.length);
      console.log(paginated.map(p => p.title));


      // Save ranked results in memory
      updateMemory(sessionId, {
        ...mergedFilters,
        lastResults: ranked,
      });

      return res.json(
        buildResponse(mergedFilters, paginated, ranked.length, false)
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

