import mysql from "mysql2/promise";

// Render + Railway ke liye BEST setup
const pool = mysql.createPool(process.env.DB_URL);

// Test connection (safe)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

export default pool;
