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
  duration: 30 * 60 * 1000 * 4,
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

//EXPRESSION PARSER
var Parser = require('expr-eval').Parser;

var parser = new Parser();

//evaluate expression
app.get('/expr-eval', function(req, res) {
  var criteria = [];

  if(typeof req.query.criteria == 'string') {
    criteria = JSON.parse(req.query.criteria);
  }
  else {
    for(criterion in req.query.criteria)
      criteria.push(JSON.parse(req.query.criteria[criterion]));
  }

  var actions = [];

  if(typeof req.query.actions == 'string') {
    actions = JSON.parse(req.query.actions);
  }
  else {
    for(action in req.query.actions)
      actions.push(JSON.parse(req.query.actions[action]));
  }

  var categories = [];

  if(typeof req.query.categories == 'string') {
    categories = JSON.parse(req.query.categories);
  }
  else {
    for(category in req.query.categories)
      categories.push(JSON.parse(req.query.categories[category]));
  }

  var antagonisticSet = [];

  if(typeof req.query.antagonisticSet == 'string') {
    antagonisticSet = JSON.parse(req.query.antagonisticSet);
  }
  else {
    for(item in req.query.antagonisticSet)
      antagonisticSet.push(JSON.parse(req.query.antagonisticSet[item]));
  }

  var similarityValues = [];

  for(criterion in criteria) {
    for(action in actions) {
      for(category in categories) {
        for(reference_action in categories[category]['reference_actions']) {
          //arguments used in the functions
          var arg1 = actions[action][criteria[criterion]['name']];
          var arg2 = categories[category]['reference_actions'][reference_action][criteria[criterion]['name']];

          for(branch in criteria[criterion]['branches']) {

            var condition = criteria[criterion]['branches'][branch]['condition'];

            if((condition.indexOf('=') != -1) && (condition.indexOf('<=') == -1) && (condition.indexOf('>=') == -1) && (condition.indexOf('!=') == -1)) {
              var a = criteria[criterion]['branches'][branch]['condition'];
              var b = '=';
              var position = criteria[criterion]['branches'][branch]['condition'].indexOf('=');
              condition = [a.slice(0, position), b, a.slice(position)].join('');
            }

            var cond = parser.parse(condition);
            var result = cond.evaluate({x: Number(arg1), y: Number(arg2)});

            if(result == true) {
              var func_branch = parser.parse(criteria[criterion]['branches'][branch]['function']);
              result = func_branch.evaluate({x: Number(arg1), y: Number(arg2)});

              var result_obj = {};
              result_obj['criterion'] = criteria[criterion]['name'];
              result_obj['action'] = actions[action]['name'];
              result_obj['reference_action'] = categories[category]['reference_actions'][reference_action]['name'];
              result_obj['result'] = result;
              similarityValues.push(result_obj);
              break;
            }
          }
        }
      }
    }
  }

  for(item in antagonisticSet) {
    for(criterion in criteria) {
      if(criteria[criterion]['name'] == antagonisticSet[item]['criterion2']) {
        for(action in actions) {
          for(category in categories) {
            for(reference_action in categories[category]['reference_actions']) {
              //arguments used in the functions
              var arg1 = actions[action][criteria[criterion]['name']];
              var arg2 = categories[category]['reference_actions'][reference_action][criteria[criterion]['name']];

              for(branch in criteria[criterion]['branches']) {

                var condition = criteria[criterion]['branches'][branch]['condition'];

                if((condition.indexOf('=') != -1) && (condition.indexOf('<=') == -1) && (condition.indexOf('>=') == -1) && (condition.indexOf('!=') == -1)) {
                  var a = criteria[criterion]['branches'][branch]['condition'];
                  var b = '=';
                  var position = criteria[criterion]['branches'][branch]['condition'].indexOf('=');
                  condition = [a.slice(0, position), b, a.slice(position)].join('');
                }

                var cond = parser.parse(condition);
                var result = cond.evaluate({x: Number(arg2), y: Number(arg1)});

                if(result == true) {
                  var func_branch = parser.parse(criteria[criterion]['branches'][branch]['function']);
                  result = func_branch.evaluate({x: Number(arg2), y: Number(arg1)});

                  var result_obj = {};
                  result_obj['criterion'] = criteria[criterion]['name'];
                  result_obj['reference_action'] = actions[action]['name'];
                  result_obj['action'] = categories[category]['reference_actions'][reference_action]['name'];
                  result_obj['result'] = result;
                  similarityValues.push(result_obj);
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  res.json(similarityValues);
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

//projects
var db2 = mongojs('mongodb://' + username + ':' + password + '@ds157247.mlab.com:57247/decspace_users', ['projects']);

//db2 functions - projects
//get all projects from db - order by project_id ascendant
app.get('/projects', function(req, res) {
  db2.projects.find().sort( {project_id: 1}, function (err, doc) {
    res.json(doc);
  });
});

//insert new project
app.post('/projects', function(req, res) {
  db2.projects.insert(req.body, function(err, doc) {
    res.json(doc);
  });
});

//delete project
app.delete('/projects/:id', function(req, res) {
  var id = req.params.id;
  db2.projects.remove({_id: mongojs.ObjectId(id)}, function(err, doc) {
    res.json(doc);
  });
});

//delphi responses
var db3 = mongojs('mongodb://' + username + ':' + password + '@ds157247.mlab.com:57247/decspace_users', ['projects']);

//db3 functions - delphi responses
//get all delphi survey responses from db
app.get('/delphi_responses', function(req, res) {
  db3.delphi_responses.find(function (err, doc) {
    res.json(doc);
  });
});

//insert new delphi response
app.post('/delphi_responses', function(req, res) {
  db3.delphi_responses.insert(req.body, function(err, doc) {
    res.json(doc);
  });
});

//delete project
app.delete('/delphi_responses/:id', function(req, res) {
  var id = req.params.id;
  db3.delphi_responses.remove({_id: mongojs.ObjectId(id)}, function(err, doc) {
    res.json(doc);
  });
});

app.listen(8082);
console.log("Server running on port 8082");
