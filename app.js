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

    db.all("SELECT * FROM categories;", function(err, data) {
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

    db.all("SELECT * FROM articleCats WHERE cat_id = " + req.params.id + ";", function(err, data) {
        data.forEach(function(e) {
            db.all("SELECT * FROM articles WHERE article_id = " + data[i].article_id + ";", function(err, articleData) {
                articles.push(articleData[0]);
            });
        });
        res.send(articles);
    });
});

app.get('/article/:id', function(req, res) {
    var template = fs.readFileSync('./views/article.html', 'utf8');

    db.all("SELECT * FROM articles WHERE article_id = " + req.params.id + ";", function(err, article) {
        db.all("SELECT name FROM authors WHERE author_id = " + article[0].author_id + ";", function(err, author) {
            var artObj = {author: author[0].name, id: article[0].article_id, title: article[0].title, date_modified: article[0].date_modified, content: article[0].content};
            var html = Mustache.render(template, artObj);
            res.send(html);
        });
    });
});

app.get('/article/:id/edit', function(req, res) {
    var template = fs.readFileSync('./views/edit.html', 'utf8');

    db.all("SELECT * FROM articles WHERE article_id = " + req.params.id + ";", function(err, article) {
        var html = Mustache.render(template, article[0]);
        res.send(html);
    });

})

app.put('/article/:id', function(req, res) {
    // get all new values - title and content
    // get new date
    // find article in db
    // update article with new values
    // email author
    // redirect to ('/article')
});


app.listen(3000, function() {
    console.log("Listening on port 3000");
});