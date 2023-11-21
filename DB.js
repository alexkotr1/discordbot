require("dotenv").config();

const { Pool } = require("pg");

const poolConfig = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  max: 20,
};

const pool = new Pool(poolConfig);

module.exports = pool;
