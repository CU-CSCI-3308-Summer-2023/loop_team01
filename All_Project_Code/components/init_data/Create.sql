DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY NOT NULL,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    admin BOOLEAN NOT NULL,
    image_url VARCHAR(100)
);

DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(300) NOT NULL,
    size VARCHAR(20) NOT NULL,
    price DECIMAL NOT NULL,
    image_url VARCHAR(100) NOT NULL,
    user_id INT NOT NULL
);

DROP TABLE IF EXISTS favorite_products CASCADE;
CREATE TABLE IF NOT EXISTS favorite_products (
    user_id INT NOT NULL,
    product_id INT NOT NULL
);


DROP TABLE IF EXISTS cart CASCADE;
CREATE TABLE IF NOT EXISTS cart (
    user_id INT NOT NULL,
    product_id INT NOT NULL
);
