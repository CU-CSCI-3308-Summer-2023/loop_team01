DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users {
    user_id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(30) NOT NULL,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    admin BOOLEAN NOT NULL,
    image_url VARCHAR(100)
};

DROP TABLE IF EXISTS clothing CASCADE;
CREATE TABLE IF NOT EXISTS clothing {
    product_id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(300) NOT NULL,
    size VARCHAR(5) CONSTRAINT limited_values CHECK (size in ('xs', 's', 'm', 'l', 'xl', 'xxl')),
    price DECIMAL NOT NULL,
    image_url VARCHAR(100),
    user_id INT NOT NULL
    FOREIGN KEY (user_id) REFERENCES users (user_id)
};

DROP TABLE IF EXISTS shoes CASCADE;
CREATE TABLE IF NOT EXISTS shoes {
    product_id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(300) NOT NULL,
    size DECIMAL CONSTRAINT limited_values CHECK (size in (6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13)),
    price DECIMAL NOT NULL,
    image_url VARCHAR(100),
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
};

DROP TABLE IF EXISTS favorite_clothes CASCADE;
CREATE TABLE IF NOT EXISTS favorite_clothes {
    user_id INT NOT NULL,
    product_id INT NOT NULL,
};

DROP TABLE IF EXISTS favorite_shoes CASCADE;
CREATE TABLE IF NOT EXISTS favorite_shoes {
    user_id INT NOT NULL,
    product_id INT NOT NULL,
};

DROP TABLE IF EXISTS cart_clothes CASCADE;
CREATE TABLE IF NOT EXISTS cart_clothes {
    user_id INT NOT NULL,
    product_id INT NOT NULL,
};

DROP TABLE IF EXISTS cart_shoes CASCADE;
CREATE TABLE IF NOT EXISTS cart_shes {
    user_id INT NOT NULL,
    product_id INT NOT NULL,
};