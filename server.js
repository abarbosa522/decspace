var express = require('express');
var app = express();
var mongojs = require('mongojs');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());

//transporter of emails
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
		user: 'decspace2017@gmail.com', // Your email id
        pass: 'decspace' // Your password
	}
});

//send 'contact us' email to support team
app.post('/contactus', function(req, res) {
  var mailOptions = {
    from: 'decspace2017@gmail.com', // sender address
    to: 'decspace2017@gmail.com', // list of receivers
    subject: 'DecSpace Support', // Subject line
    text: req.body.message + '\nReply to ' + req.body.name + '<' + req.body.email + '>'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if(error) {
      res.json(error);
    }
    else {
      res.json('Message sent!');
    }
  });
});

//send password to user
app.post('/password', function(req, res) {
  var mailOptions = {
    from: 'decspace2017@gmail.com', // sender address
    to: req.body.email, // list of receivers
    subject: 'Password Recovery', // Subject line
    text: 'Your password is ' + req.body.password
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if(error) {
      res.json(error);
    }
    else {
      res.json('Message sent!');
    }
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
