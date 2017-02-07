var express = require('express');
var app = express();
var mongojs = require('mongojs');
var bodyParser = require('body-parser');

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());

//mailgun connection and retrieval
var api_key = 'key-17f1a48a3730fda7e3e6d07514e08f75';
var domain = 'sandboxdfdb982a78c3439f9feda9854fcd8afc.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

app.post('/contact', function(req, res) {
  var data = {
    from: req.body.name + ' <postmaster@sandboxdfdb982a78c3439f9feda9854fcd8afc.mailgun.org>',
    to: 'decspace2017@gmail.com',
    subject: 'DecSpace Support',
    text: req.body.message + '\nReply To: ' + req.body.address + '\n'
  };

  mailgun.messages().send(data, function (error, body) {
    res.json(body);
  });
});

//database connections
var username = 'abarbosa';
var password = 'andrebarbosa';

//user accounts
var db1 = mongojs('mongodb://' + username + ':' + password + '@ds157247.mlab.com:57247/decspace_users', ['accounts']);

//db1 functions - accounts
//get all accounts from db
app.get('/accounts', function(req, res) {
  db1.accounts.find().sort( {name: 1}, function (err, doc) {
    res.json(doc);
  });
});

//insert new account
app.post('/accounts', function(req, res) {
  db1.accounts.insert(req.body, function(err, doc) {
    res.json(doc);
  });
});

//delete account
app.delete('/accounts/:id', function(req, res) {
  var id = req.params.id;
  db1.accounts.remove({_id: mongojs.ObjectId(id)}, function(err, doc) {
    res.json(doc);
  });
});

app.listen(8082);
console.log("Server running on port 8082");
