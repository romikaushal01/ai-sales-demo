const pool = require("./db");

async function fixDatabase() {
  try {
    await pool.query(`
      ALTER TABLE analytics_events
      ALTER COLUMN product_title DROP NOT NULL;
    `);

    console.log("✅ product_title NOT NULL removed successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error.message);
  } finally {
    await pool.end();
  }
}

fixDatabase();