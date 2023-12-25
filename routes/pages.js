const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  password: process.env.DATABASE_PASS,
  port: process.env.DATABASE_PORT,
  ssl: true
});

router.get("/", userController.isLoggedIn, async (req, res) => {
  try {
    if (req.user) {
      const result = await pool.query("SELECT * FROM vizag WHERE id = $1", [req.user.id]);
      const user = result.rows[0];
      res.render("index", { user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error fetching user data from PostgreSQL:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/profile", userController.isLoggedIn, async (req, res) => {
  try {
    if (req.user) {
      const result = await pool.query("SELECT * FROM vizag WHERE id = $1", [req.user.id]);
      const user = result.rows[0];
      res.render("profile", { user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error fetching user data from PostgreSQL:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

module.exports = router;
