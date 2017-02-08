var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());

//SESSION MANAGEMENT
var session = require('client-sessions');

//session handler
app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));

//log in
app.post('/login', getAccounts, function(req, res) {
  var correct_log_in = false;
  var user;
  //result retrieved from the database with the usernames and corresponding passwords
  var accounts = req.body.accounts;

  //check if the email and password match to the information in the database
  for(account in accounts) {
    if(accounts[account]['email'] == req.body.email && accounts[account]['password'] == req.body.password) {
      correct_log_in = true;
      user = accounts[account]['email'];
      break;
    }
  }

  if(correct_log_in) {
    req.session.user = user;
    delete req.body.accounts;
    res.send('Successful Login');
  }
  else {
    res.send('Invalid Login');
  }
});

//request log in
app.get('/requestlogin', function(req, res) {
  res.send(req.session);
});

//log out
app.get('/logout', function(req, res) {
  req.session.reset();
  res.send(req.session);
});

//EMAIL HANDLING
var nodemailer = require('nodemailer');

//email transporter
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

//DATABASE CONNECTIONS
var mongojs = require('mongojs');
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

function getAccounts(req, res, next) {
  db1.accounts.find().sort( {name: 1}, function (err, doc) {
    req.body.accounts = doc;
    next();
  });
}

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
