const mysql = require("mysql2/promise");

const DB_ENABLED = process.env.DB_ENABLED !== "false";

const pool = DB_ENABLED
  ? mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "kronos",
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      charset: "utf8mb4",
      dateStrings: true,
    })
  : null;

const testConnection = async () => {
  if (!pool) return false;
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
};

const getExistingTables = async () => {
  if (!pool) return new Set();
  const [rows] = await pool.query("SHOW TABLES");
  return new Set(rows.map((row) => Object.values(row)[0]));
};

module.exports = {
  pool,
  DB_ENABLED,
  testConnection,
  getExistingTables,
};
