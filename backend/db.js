// Database setup - same idea as lab 9 (connection pool), using mysql2
require("dotenv").config();
const mysql = require("mysql2");

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  port: Number(process.env.DB_PORT) || 3306,
};
const DB_NAME = process.env.DB_NAME || "careertrack";

// 1) Make sure the database exists (so you don't have to create it by hand)
const bootstrap = mysql.createConnection(config);
bootstrap.on("error", function () {}); // errors are handled in the callback below
bootstrap.query("CREATE DATABASE IF NOT EXISTS `" + DB_NAME + "`", function (err) {
  if (err) {
    // Show the REAL reason (e.g. ECONNREFUSED = MySQL not running,
    // ER_ACCESS_DENIED_ERROR = wrong password in .env)
    console.error("Database connection failed:", err.code, "-", err.message);
    return;
  }
  bootstrap.end();

  // 2) Create the tables if they don't exist yet
  const tables = [
    `CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company VARCHAR(60) NOT NULL,
      position VARCHAR(60) NOT NULL,
      type VARCHAR(20) NOT NULL,
      application_date DATE NOT NULL,
      job_link VARCHAR(200),
      status VARCHAR(20) NOT NULL,
      interview_date DATE,
      notes TEXT,
      cv_filename VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS profiles (
      id INT PRIMARY KEY,
      full_name VARCHAR(60) NOT NULL,
      email VARCHAR(100) NOT NULL,
      university VARCHAR(100),
      cv_filename VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(30) NOT NULL,
      last_name VARCHAR(30) NOT NULL,
      gender VARCHAR(10) NOT NULL,
      mobile VARCHAR(10) NOT NULL,
      date_of_birth DATE NOT NULL,
      email VARCHAR(60) NOT NULL,
      language VARCHAR(20) NOT NULL,
      message VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  tables.forEach(function (sql) {
    pool.query(sql, function (e) {
      if (e) console.error("Table creation failed:", e.message);
    });
  });
  console.log("MySQL connected successfully!");
});

// Connection pool (like lab 9)
const pool = mysql.createPool({
  connectionLimit: 10,
  ...config,
  database: DB_NAME,
});

module.exports = pool;