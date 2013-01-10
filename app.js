/**
 * Module dependencies.
 */

var express = require('express'),
    github_attask = require('./lib/github-attask');

var app = express.createServer();
module.exports = app;

// Configuration

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes

app.post('/', github_attask.index);

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Listening on " + port);
});
