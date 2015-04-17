var express = require('express');
var sqlite3 = require('sqlite3');
var fs = require('fs');
var Mustache = require('mustache');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var app = express();
var db = new sqlite3.Database('./db/wiki.db');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(methodOverride('_method'));


app.get('/', function(req, res) {
    var template = fs.readFileSync('./views/index.html', 'utf8');

    db.all("SELECT * FROM categories;", {}, function(err, data) {
        var indexHtml = Mustache.render(template, {
            allCategories: data
        });
        res.send(indexHtml);
    });
});

//COME BACK TO THIS
app.get('/category/:id', function(req, res) {
    var template = fs.readFileSync('./views/category.html', 'utf8');
    var articles = [];

    db.all("SELECT * FROM categories WHERE cat_id = " + req.params.id + ";", {}, function(err, category) {

        db.all("SELECT * FROM articleCats WHERE cat_id = " + req.params.id + ";", {}, function(err, article_ids) {
            article_ids.forEach(function(e) {
                
                db.all("SELECT * FROM articles WHERE article_id = " + e.article_id + ";", {}, function(err, articleData) {
                    articles.push(articleData[0]);
                    if (articles.length === article_ids.length) {
                        res.send(Mustache.render(template, {
                            name: category[0].name,
                            allArticles: articles,
                        }));
                    }
                });
            });
        });
    });
});


// ADD CATEGORIES
app.get('/article/:id', function(req, res) {
    var template = fs.readFileSync('./views/article.html', 'utf8');

    db.all("SELECT * FROM articles WHERE article_id = " + req.params.id + ";", function(err, article) {
        db.all("SELECT name FROM authors WHERE author_id = " + article[0].author_id + ";", {}, function(err, author) {
            var artObj = {
                author: author[0].name,
                id: article[0].article_id,
                title: article[0].title,
                date_modified: article[0].date_modified,
                content: article[0].content
            };
            var html = Mustache.render(template, artObj);
            res.send(html);
        });
    });
});

app.get('/article/:id/edit', function(req, res) {
    var template = fs.readFileSync('./views/edit.html', 'utf8');

    db.all("SELECT * FROM articles WHERE article_id = " + req.params.id + ";", {}, function(err, article) {
        var html = Mustache.render(template, article[0]);
        res.send(html);
    });

})

app.get('/new', function(req, res) {
    var template = fs.readFileSync('./views/new.html', 'utf8');

    db.all("SELECT * FROM categories;", {}, function(err, data) {
        res.send(Mustache.render(template, {
            allCategories: data
        }));
    });
});

// NEED TO ADD CATEGORIES - Get category IDs from checked categories - insert into articleCats
// If new category - insert into categories table and articleCats
app.post('/article/', function(req, res) {

    db.serialize(function() {
        // Add author to DB if author doesn't exist
        db.run("INSERT INTO authors (name, email) SELECT '" + req.body.name + "', '" + req.body.email + "' WHERE NOT EXISTS (SELECT 1 FROM authors WHERE email = '" + req.body.email + "');");

        db.all("SELECT * FROM authors WHERE email = '" + req.body.email + "';", {}, function(err, data) {
            db.run("INSERT INTO articles (title, content, date_modified, author_id) VALUES ('" + req.body.title + "', '" + req.body.content + "', '" + new Date() + "', " + data[0].author_id + ");");
            db.all("SELECT * FROM articles WHERE title = '" + req.body.title + "';", {}, function(err, article) {
                console.log(article);
                res.redirect('/article/' + article[0].article_id);
            });
        });
    });
});

app.put('/article/:id', function(req, res) {

    // Updated article details
    var newTitle = req.body.title;
    var newContent = req.body.content;

    // New author details
    var authorName = req.body.name;
    var authorEmail = req.body.email;

    // Update article
    db.run("UPDATE articles SET title = '" + newTitle + "', content = '" + newContent + "', date_modified = '" + new Date() + "' WHERE article_id = " + req.params.id + ";");

    // Add author if new
    db.all("SELECT * FROM authors WHERE email = '" + authorEmail + "';", {}, function(err, data) {
        console.log(data);
        if (data.length === 0) { // Author does not exist - add as new
            db.run("INSERT INTO authors (name, email) VALUES ('" + authorName + "', '" + authorEmail + "');");
        } else {
            // Author already exists - do nothing
        }
        res.redirect('/article/' + req.params.id);
    });
});

app.delete('/article/:id', function(req, res) {
    db.run("DELETE FROM articles WHERE article_id = " + req.params.id + ";");

    res.redirect('/');

});


app.listen(3000, function() {
    console.log("Listening on port 3000");
});