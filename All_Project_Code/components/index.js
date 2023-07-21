// importing the dependencies
// Express is a NodeJS framework that, among other features, allows us to create HTML templates.
const express = require('express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const path = require("path");
require('dotenv').config();
const session = require("express-session");
const bcrypt = require('bcrypt');
const { brotliDecompress } = require('zlib');
const { markAsUntransferable } = require('worker_threads');

// defining the Express app
const app = express();
// defining a static directoy
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
WHERE favorite_products.user_id=$1;`;
const cart = `SELECT * FROM cart
JOIN products on cart.product_id=products.product_id
WHERE cart.user_id=$1`;
const user_image = `SELECT image_url FROM users WHERE user_id=$1`;
const add_to_cart = `INSERT INTO cart (user_id, product_id) VALUES ($1, $2)`;
const add_to_favorites = `INSERT INTO favorite_products (user_id, product_id) VALUES ($1, $2)`;

// <!-- Endpoint 1 :  Default endpoint ("/") -->
app.get('/', (req, res) => {
  var filter = '%';
  if (req.query.filter){
    filter = req.query.filter+'%';
  }
  if (!req.session.user){
    db.any(all_products, [filter])
    .then(products => {
      res.render("pages/home", {
        products,
        favorite_products: [],
        cart: [],
        user_image: [],
      });
    })
    .catch(err => {
      res.render("pages/home", {
        products: [],
        favorite_products: [],
        cart: [],
        user_image: [],
      });
    });
  }
  else{
    db.task('get-all', task => {
      return task.batch([task.any(all_products, [filter]), task.any(favorite_products, [req.session.user.user_id]), task.any(cart, [req.session.user.user_id]), task.one(user_image, [req.session.user.user_id])]);
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
        products: [],
        favorite_products: [],
        cart: [],
        user_image: [],
      });
    });
  }
});

app.get("/search", (req, res) => {
  res.redirect("/?filter=" + req.query.filter);
});

app.post("/cart/add", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    db.none(add_to_cart, [req.session.user.user_id, req.body.product_id])
    .then(() => {
      res.redirect("/cart");
    })
    .catch(err => {
      res.redirect("/");
    });
  }
});

app.post("/cart/remove", (req, res) => {
  var query = `DELETE FROM cart WHERE user_id=$1 AND product_id=$2`;

  db.none(query, [req.session.user.user_id, req.body.product_id])
  .then(() => {
    res.redirect("/cart");
  })
  .catch(err => {
    res.redirect("/cart");
  });
});

app.post("/favorite/add", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    db.none(add_to_favorites, [req.session.user.user_id, req.body.product_id])
    .then(() => {
      res.redirect("/favorites");
    })
    .catch(err => {
      res.redirect("/");
    });
  }
});

app.post("/favorite/remove", (req, res) => {
  var query = `DELETE FROM favorite_products WHERE user_id=$1 AND product_id=$2`;

  db.none(query, [req.session.user.user_id, req.body.product_id])
  .then(() => {
    res.redirect("/favorite");
  })
  .catch(err => {
    res.redirect("/favorite");
  });
});

app.get("/login", (req, res) => {
  if (!req.session.user){
    res.render("pages/login");
  }
  else{
    res.redirect("/user");
  }
});

app.get("/signUp", (req, res) => {
  res.render("pages/signUp");
});

app.post("/login", async (req, res) => {
  const query = `SELECT * FROM users WHERE username='${req.body.username}'`;
  
  const data = await db.any(query);
  if (data.length === 0){
    res.redirect("/signUp");
  }
  else{
    const match = bcrypt.compare(req.body.password, data[0].password);
    if (match){
      user.user_id = data[0].user_id;
      user.first_name = data[0].first_name;
      user.last_name = data[0].last_name;
      user.username = data[0].username;
      user.email = data[0].email;
      user.password = data[0].password;
      user.admin = data[0].admin;
      user.image_url = data[0].image_url;

      req.session.user = user;
      req.session.save();
      res.redirect("/");
    } 
    else{
      res.redirect("/login");
    }
  }
});


app.post("/signUp", async (req, res) => {
  var newUser = `SELECT username FROM users WHERE username='${req.body.username}'`;
  const user = await db.any(newUser);
    
  if (user.length === 1){
    res.redirect("/signUp");
  }
  else{
    const hash = await bcrypt.hash(req.body.password, 10);
    newUser = `INSERT INTO users (first_name, last_name, username, email, password, admin, image_url)
    VALUES ('First', 'Last', $1, $2, $3, false, 'images/default.png')`;

    const user = await db.none(newUser, [req.body.username, req.body.email, hash]);
    res.redirect("/login");
  }
});

app.get("/cart", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    db.any(cart, [req.session.user.user_id])
    .then(cartItems => {
      res.render("pages/cart", {
        cartItems,
      });
    })
    .catch(err => {
      res.render("pages/cart", {
        cartItems: [],
      });
    });
  }
});

app.get("/user", (req, res) => {
  res.render("pages/user", {
    user: req.session.user,
  });
});

app.post("/user", async (req, res) => {
  var query = `UPDATE users SET first_name=$1, last_name=$2, username=$3, email=$4, password=$5 WHERE user_id=${req.session.user.user_id}`;

  if (req.body.first_name != ''){
    req.session.user.first_name = req.body.first_name;
  }
  if (req.body.last_name != ''){
    req.session.user.last_name = req.body.last_name;
  }
  if (req.body.username != ''){
    req.session.user.username = req.body.username;
  }
  if (req.body.email != ''){
    req.session.user.email = req.body.email;
  }
  if (req.body.password != ''){
    const hash = await bcrypt.hash(req.body.password, 10);
    req.session.user.password = hash;
  }
  req.session.save();
  await db.none(query, [req.session.user.first_name, req.session.user.last_name, req.session.user.username, req.session.user.email, req.session.user.password]);
  res.redirect('/user');
});

app.get("/logout", (req, res) => {
  req.session.destroy(); 
  res.redirect("/");
});

app.get("/favorites", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    db.task('get-everyting', task => {
      return task.batch([db.any(favorite_products, [req.session.user.user_id]), db.any(cart, [res.session.user.user_id])]);
    })
    .then(data => {
      res.render("pages/favorites", {
        products: data[0],
        cart: data[1],
      });
    })
    .catch(err => {
      res.render("pages/favorites", {
        products: [],
        cart: [],
      });
    });
  }
});

app.get("/carousel", (req, res) => {
  if (!req.session.user){
    db.any(all_products, ['%'])
    .then(products => {
      const random = Math.floor(Math.random() * products.length);
      res.render("pages/carousel", {
        products,
        random,
        cart: [],
        favorite_products: [],
      });
    })
    .catch(err => {
      res.render("pages/carousel", {
        products: [],
        random,
        cart: [],
        favorite_products: [],
      });
    });
  }
  else{
    db.task('get-random', task => {
      return task.batch([db.any(all_products, ['%']), db.any(cart, [req.session.user.user_id]), db.any(favorite_products, [req.session.user.user_id])]);
    })
    .then(data => {
      const random = Math.floor(Math.random() * data[0].length);
      res.render("pages/carousel", {
        products: data[0],
        random,
        cart: data[1],
        favorite_products: data[2],
      });
    })
    .catch(err => {
      res.render("pages/carousel", {
        products: [],
        cart: [],
        favorite_products: [],
      });
    });
  }
});

app.get("/add", (req, res) => {
  if (!req.session.user){
    res.redirect("/login");
  }
  else{
    res.render("pages/add_product"); 
  }
});

app.post("/add", (req, res) => {
  var query = `INSERT INTO products (name, description, size, price, image_url, user_id) VALUES ($1,$2,$3,$4,$5,${req.session.user.user_id})`;
  db.none(query, [req.body.name, req.body.description, req.body.size, req.body.price, req.body.image_url])
  .then(() => {
    res.redirect('/');
  })
  .catch(err => {
    console.log(err);
    res.redirect('/add');
  });
});

// Listening on port 4000
app.listen(4000, () => {
  console.log('listening on port 4000');
});