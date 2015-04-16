var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./wiki.db');

db.run("CREATE TABLE authors (author_id integer PRIMARY KEY, name varchar, email varchar);");

db.run("CREATE TABLE articles (article_id integer PRIMARY KEY, title varchar, content text, date_modified date, author_id integer, FOREIGN KEY(author_id) REFERENCES authors(author_id));");

db.run("CREATE TABLE categories (cat_id integer PRIMARY KEY, name varchar);");

db.run("CREATE TABLE articleCats (id integer PRIMARY KEY, article_id integer, cat_id integer);");