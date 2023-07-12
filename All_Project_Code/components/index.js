// importing the dependencies
// Express is a NodeJS framework that, among other features, allows us to create HTML templates.
const express = require('express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const path = require("path");
require('dotenv').config();
const session = require("express-session");
const { brotliDecompress } = require('zlib');

// defining the Express app
const app = express();
const staticDir = path.join(__dirname, "resources");
app.use(express.static(staticDir));
// using bodyParser to parse JSON in the request body into JS objects
app.use(bodyParser.json());
// Database connection details
const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: true
};
// Connect to database using the above details
const db = pgp(dbConfig);

// db test
db.connect()
  .then((obj) => {
    // Can check the server version here (pg-promise v10.1.0+):
    console.log("Database connection successful");
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

// set the view engine to ejs
app.set("view engine", "ejs");

// set session
app.use(
  session({
    secret: "XASDASDA",
    saveUninitialized: true,
    resave: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const user= {
  user_id: undefined,
  first_name: undefined,
  last_name: undefined,
  username: undefined,
  email: undefined,
  password: undefined,
  admin: undefined,
  image_url: undefined,
};
const all_products = `SELECT * FROM products WHERE name LIKE $1`;
const favorite_products = `SELECT * FROM favorite_products 
JOIN products ON favorite_products.product_id=products.product_id 
WHERE favorite_product.user_id=$1;`;
const cart = `SELECT * FROM cart
JOIN products on cart.product_id=products.product_id
WHERE user_id=$1`;
const user_image = `SELECT image_url FROM users WHERE user_id=$1`;
const add_to_cart = `INSERT INTO cart (user_id, product_id) VALUES ($1, $2)`;
const add_to_favorites = `INSERT INTO favorite_products (user_id, product_id) VALUES ($1, $2)`;

// <!-- Endpoint 1 :  Default endpoint ("/") -->
app.get('/', (req, res) => {
  var filter = '%';
  if (req.query.name){
    filter = req.query.name+'%';
  }
  if (!req.session.user){
    db.any(all_products, [filter])
    .then(products => {
      res.render("pages/home", {
        products,
      });
    })
    .catch(err => {
      res.render("pages/home", {
        products: [],
      });
    });
  }
  else{
    db.task('get-all', task => {
      return task.batch([task.any(all_products, [filter]), task.any(favorite_products, [req.session.user.user_id]), task.one(cart, [req.session.user.user_id]), task.one(user_image, [req.session.user.user_id])]);
    })
    .then(products => {
      res.render("pages/home", {
        products: products[0],
        favorite_products: products[1],
        cart: products[2],
        user_image: products[3],
      });
    })
    .catch(err => {
      res.render("pages/home", {
        all_products: [],
        favorite_products: [],
        cart: [],
        user_image: [],
      });
    });
  }
});

app.post("/search", (req, res) => {
  //res.redirect("/?name=" + req.query.name); name is undefined?
  res.redirect("/?name=");
});

app.post("/cart/add", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    db.none(add_to_cart, [req.session.user.user_id, req.body.product_id])
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      res.redirect("/");
    });
  }
});

app.post("/favorite/add", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    db.none(add_to_favorites, [req.session.user.user_id, req.body.product_id])
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      res.redirect("/");
    });
  }
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});




app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/logout");
});

// Listening on port 4000
app.listen(4000, () => {
  console.log('listening on port 4000');
});