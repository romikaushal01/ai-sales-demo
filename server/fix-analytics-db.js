const pool = require("./db");

async function fixDatabase() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS analytics_events;

      CREATE TABLE analytics_events (
        id BIGSERIAL PRIMARY KEY,
        event TEXT,
        "timestamp" TIMESTAMPTZ,
        session_id TEXT,
        query TEXT,
        results INTEGER,
        product_title TEXT,
        brand TEXT,
        category TEXT,
        color TEXT,
        page INTEGER,
        success BOOLEAN,
        sort TEXT,
        max_price NUMERIC,
        product_price NUMERIC,
        product_vendor TEXT,
        product_type TEXT,
        compared_products JSONB,
        recommendation_type TEXT,
        cart_id TEXT,
        items INTEGER,
        checkout_url TEXT
      );
    `);

  } catch (error) {
  } finally {
    await pool.end();
  }
}

fixDatabase();