const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  password: process.env.DATABASE_PASS,
  port:  process.env.DATABASE_PORT,
  ssl: true
});

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render("login", {
        msg: "Please enter your Email and Password",
        msg_type: "error",
      });
    }

    pool.query("SELECT * FROM vizag WHERE email=$1", [email], async (error, result) => {
      console.log(result.rows);
      if (result.rows.length <= 0) {
        return res.status(401).render("login", {
          msg: "Please enter your Email and Password otherwise SIGNUP",
          msg_type: "error",
        });
      } else {
        if (!(await bcrypt.compare(password, result.rows[0].pass))) {
          return res.status(401).render("login", {
            msg: "Please enter your Email and Password",
            msg_type: "error",
          });
        } else {
          const id = result.rows[0].id;
          const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });
          console.log("The Token is" + token);
          const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
            httpOnly: true,
          };
          res.cookie("srav", token, cookieOptions);
          res.status(200).redirect("/");
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};

exports.register = (req, res) => {
  console.log(req.body);
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const password_confirm = req.body.password_confirm;

  pool.query("SELECT email FROM vizag WHERE email=$1", [email], async (error, result) => {
    if (error) {
      console.log(error);
    }
    if (result.rows.length > 0) {
      return res.render("register", { msg: "Email id already taken please Login", msg_type: "error" });
    } else if (password !== password_confirm) {
      return res.render("register", { msg: "Password do not match", msg_type: "error" });
    }

    let hashedPassword = await bcrypt.hash(password, 8);

    pool.query(
      "INSERT INTO vizag (name, email, pass) VALUES ($1, $2, $3)",
      [name, email, hashedPassword],
      (error, result) => {
        if (error) {
          console.log(error);
        } else {
          console.log(result);
          return res.render("register", { msg: "User Registration Success", msg_type: "good" });
        }
      }
    );
  });
};

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.srav) {
    try {
      const decode = await promisify(jwt.verify)(req.cookies.srav, process.env.JWT_SECRET);

      pool.query("SELECT * FROM vizag WHERE id=$1", [decode.id], (err, results) => {
        if (!results.rows) {
          return next();
        }
        req.user = results.rows[0];
        return next();
      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.logout = async (req, res) => {
  res.cookie("srav", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).redirect("/");
};
