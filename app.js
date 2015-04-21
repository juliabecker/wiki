var express = require('express');
var sqlite3 = require('sqlite3');
var fs = require('fs');
var Mustache = require('mustache');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var marked = require('marked');
var config = require('./config.js');
var sendgrid = require('sendgrid')(config.sendgrid_api_user, config.sendgrid_api_key);

var app = express();
var db = new sqlite3.Database('./db/wiki.db');
var email = new sendgrid.Email();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(methodOverride('_method'));
//app.use(express.static('views'));

// Index page
app.get('/', function(req, res) {

    var template = fs.readFileSync('./views/index.html', 'utf8');

    db.all("SELECT * FROM categories;", {}, function(err, data) {
        var indexHtml = Mustache.render(template, {
            allCategories: data
        });
        res.send(indexHtml);
    });
});

// Category results from dropdown
app.get('/category', function(req, res) {
    if (req.query.category) {
        res.redirect('/category/' + req.query.category);
    }
});

// Category results
app.get('/category/:id', function(req, res) {
    var template = fs.readFileSync('./views/category.html', 'utf8');

    db.all("SELECT * FROM categories WHERE cat_id = " + req.params.id + ";", {}, function(err, category) {

        db.all("SELECT * FROM articles INNER JOIN articleCats ON articles.article_id = articleCats.article_id WHERE articleCats.cat_id = " + req.params.id + ";", {}, function(err, articles) {
            res.send(Mustache.render(template, {
                name: category[0].name,
                allArticles: articles
            }));
        });
    });
});

// Get article detail
app.get('/article/:id', function(req, res) {
    var template = fs.readFileSync('./views/article.html', 'utf8');
    var allCategories = [];

    db.all("SELECT * FROM articles WHERE article_id = " + req.params.id + ";", function(err, article) {
        db.all("SELECT name FROM authors WHERE author_id = " + article[0].author_id + ";", {}, function(err, author) {
            db.all("SELECT * FROM articleCats WHERE article_id = " + req.params.id + ";", function(err, catIds) {
                catIds.forEach(function(e) {
                    db.all("SELECT * FROM categories WHERE cat_id = " + e.cat_id + ";", {}, function(err, categories) {
                        allCategories.push(categories[0]);
                        if (allCategories.length === categories.length) {
                            var articleObj = {
                                allCategories: allCategories,
                                author: author[0].name,
                                id: article[0].article_id,
                                title: article[0].title,
                                date_modified: article[0].date_modified,
                                content: marked(article[0].content)
                            };
                            var html = Mustache.render(template, articleObj);
                            res.send(html);
                        }
                    })
                });
            });
        });
    });
});

// Edit article detail
app.get('/article/:id/edit', function(req, res) {
    var template = fs.readFileSync('./views/edit.html', 'utf8');

    db.all("SELECT * FROM authors;", {}, function(err, authors) {
        db.all("SELECT * FROM articles WHERE article_id = " + req.params.id + ";", {}, function(err, article) {
            var html = Mustache.render(template, {
                "article_id": req.params.id,
                "title": article[0].title,
                "content": article[0].content,
                "allAuthors": authors
            });

            res.send(html);
        })
    });
});

// Write new article
app.get('/new', function(req, res) {
    var template = fs.readFileSync('./views/new.html', 'utf8');

    db.all("SELECT * FROM categories;", {}, function(err, categories) {
        db.all("SELECT * FROM authors;", {}, function(err, authors) {
            res.send(Mustache.render(template, {
                allCategories: categories,
                allAuthors: authors
            }));
        });
    });
});

// Search Results
app.get('/results', function(req, res) {
    var template = fs.readFileSync('./views/results.html', 'utf8');

    db.all("SELECT * FROM articles WHERE content LIKE '%" + req.query.searchTerm + "%' OR title LIKE '%" + req.query.searchTerm + "%';", {}, function(err, searchResults) {
        var html = Mustache.render(template, {
            name: req.query.searchTerm,
            allArticles: searchResults
        });
        res.send(html);
    })
});

// Post new article
app.post('/article', function(req, res) {

    db.serialize(function() {

        db.run("INSERT INTO articles (title, content, date_modified, author_id) VALUES ('" + req.body.title + "', '" + req.body.content + "', '" + new Date() + "', " + req.body.author_id + ");");

        db.all("SELECT * FROM articles WHERE title = '" + req.body.title + "';", {}, function(err, article) {
            // Add article-category relationships
            if (req.body.categories) {
                if (Array.isArray(req.body.categories)) { // Multiple categories were checked
                    req.body.categories.forEach(function(e) {
                        db.run("INSERT INTO articleCats (article_id, cat_id) VALUES (" + article[0].article_id + ", " + e + ");");
                    });
                } else { // Just one category was checked
                    db.run("INSERT INTO articleCats (article_id, cat_id) VALUES (" + article[0].article_id + ", " + req.body.categories + ");");
                }
            }

            res.redirect('/article/' + article[0].article_id);

            // Adding new categories not working - commented out temporarily

            // if (req.body.newCat != '') { // User entered new category value
            //     db.run("INSERT INTO categories (name) VALUES ('" + req.body.newCat + "');");

            //     db.all("SELECT * FROM categories WHERE name = '" + req.body.newCat + "');", {}, function(err, category) {
            //             //console.log(category);
            //             setTimeout(function() {
            //                 db.run("INSERT INTO articleCats (article_id, cat_id) VALUES (" + article[0].article_id + ", " + category[0].cat_id + ");");

            //                 //});
            //             }, 5000);

            //         }
            //     });

        });
    });
});

// Add new author
app.post('/newauthor', function(req, res) {

    db.run("INSERT INTO authors (name, email) SELECT '" + req.body.newAuthorName + "', '" + req.body.newAuthorEmail + "' WHERE NOT EXISTS (SELECT 1 FROM authors WHERE email = '" + req.body.newAuthorEmail + "');");

    if (req.body.article_id != undefined) {
        res.redirect('article/' + req.body.article_id + '/edit'); // Redirect to edited article
    } else {
        res.redirect('new'); // Redirect to new article
    }
});

// Update article
app.put('/article/:id', function(req, res) {

    db.all("SELECT name, email FROM authors INNER JOIN articles ON articles.author_id = authors.author_id WHERE articles.article_id = " +req.params.id + ";", {}, function(err, author) {

        email.addTo(author[0].email);
        email.setFrom("jcbecker26@gmail.com");
        email.setSubject("Choco Wiki Article Modified");
        email.setHtml("Hi " + author[0].name + ", Your article on Choco Wiki has been modified.");

        sendgrid.send(email);
    })


    db.run("UPDATE articles SET content = '" + req.body.content.replace(/'/g, "''") + "', date_modified = '" + new Date() + "' WHERE article_id = " + req.params.id + ";");
    res.redirect('/article/' + req.params.id);
});

// Delete article
app.delete('/article/:id', function(req, res) {
    db.run("DELETE FROM articles, articleCats WHERE article_id = " + req.params.id + ";");

    res.redirect('/');

});


app.listen(3000, function() {
    console.log("Listening on port 3000");
});