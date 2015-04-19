var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./wiki.db');

db.run("PRAGMA foreign_keys = ON;");

db.run("INSERT INTO authors (name, email) VALUES ('Julia Becker', 'jcbecker26@gmail.com');");
db.run("INSERT INTO authors (name, email) VALUES ('Susan Henke', 'juliadulia@yahoo.com');");

db.run("INSERT INTO articles (title, content, date_modified, author_id) VALUES ('Dark Chocolate', 'Dark chocolate sample content blah blah blah blah', '" + new Date() + "', 1);");
db.run("INSERT INTO articles (title, content, date_modified, author_id) VALUES ('Milk Chocolate', 'Milk chocolate sample content blah blah blah blah', '" + new Date() + "', 2);");
db.run("INSERT INTO articles (title, content, date_modified, author_id) VALUES ('Devils Food Cake', 'Devils food cake sample content blah blah blah blah', '" + new Date() + "', 2);");

db.run("INSERT INTO categories (name) VALUES ('Types of Chocolate');");
db.run("INSERT INTO categories (name) VALUES ('Chocolate Desserts');");

db.run("INSERT INTO articleCats (article_id, cat_id) VALUES (1, 1);");
db.run("INSERT INTO articleCats (article_id, cat_id) VALUES (3, 2);");
db.run("INSERT INTO articleCats (article_id, cat_id) VALUES (2, 1);");

