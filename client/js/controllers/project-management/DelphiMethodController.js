app.controller('DelphiMethodController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      if(typeof res.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').success(function(response) {
          for(account in response) {
            if(response[account].email == $scope.username) {
              $scope.name = response[account].name;
              break;
            }
          }
        });
      }
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response[proj]['name'];
          //change the date of the last update of the project
          response[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          /*get data
          getCriteria();
          getActions();
          getExecutions();*/
        });
      });
    });
  }

  /*** BUTTON BAR FUNCTIONS ***/

  //variable to show or hide the save success message
  $scope.showSaveSuccess = false;

  //variable to show or hide the confirmation or cancel reset data
  $scope.showResetData = false;

  //save the current data on the database
  $scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {

          /*
          //insert criteria
          response[proj]['criteria'] = $scope.criteria;
          //insert actions
          response[proj]['actions'] = $scope.actions;
          */

          //get the id of the document
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          $scope.showSaveSuccess = true;
        });
      });
    });
  }

  //reload the stored data on the database
  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          /*
          if(response[proj]['criteria'] != undefined)
            $scope.criteria = response[proj]['criteria'];

          if(response[proj]['actions'] != undefined)
            $scope.actions = response[proj]['actions'];
            */

          break;
        }
      }
    });
  }

  //show confirmation and cancel buttons for resetting the current data
  $scope.resetData = function() {
    $scope.showResetData = true;
  }

  //reset the current data
  $scope.confirmResetData = function() {
    /*
    $scope.criteria = [];
    $scope.actions = [];
    */
    $scope.showResetData = false;
  }

  //cancel the reset data
  $scope.cancelResetData = function() {
    $scope.showResetData = false;
  }

  /*** IMPORT AND EXPORT FUNCTIONS ***/

  //select emails and questions import checkboxes
  $scope.selectAllImport = function() {
    document.getElementById('import-emails-check').checked = true;
    document.getElementById('import-questions-check').checked = true;
  }

  //deselect emails and questions import checkboxes
  $scope.selectNoneImport = function() {
    document.getElementById('import-emails-check').checked = false;
    document.getElementById('import-questions-check').checked = false;
  }

  //select emails and questions export checkboxes
  $scope.selectAllExport = function() {
    document.getElementById('export-emails-check').checked = true;
    document.getElementById('export-questions-check').checked = true;
  }

  //deselect emails and questions export checkboxes
  $scope.selectNoneExport = function() {
    document.getElementById('export-emails-check').checked = false;
    document.getElementById('export-questions-check').checked = false;
  }

  /*** INPUT DATA - EMAILS ***/

  //variable that stores all the current email addresses
  $scope.emails = [];

  //variable that holds the email that is selected to be deleted
  $scope.delete_email = '';

  //variable that controls the showing/hiding of the emails
  $scope.emails_eye = 1;

  //add a new email
  $scope.addEmail = function() {
    if($scope.emails.length == 0)
      $scope.new_email.id = 1;
    else
      $scope.new_email.id = $scope.emails[$scope.emails.length - 1]['id'] + 1;

    $scope.emails.push(angular.copy($scope.new_email));

    $scope.new_email.address = '';
  }

  //delete a certain email
  $scope.deleteEmail = function(email) {
    $scope.delete_email = email.id;
  }

  //confirm the email deletion
  $scope.confirmDeleteEmail = function(email) {
    $scope.emails.splice($scope.emails.indexOf(email), 1);
    $scope.delete_email = '';
  }

  //cancel the email deletion
  $scope.cancelDeleteEmail = function() {
    $scope.delete_email = '';
  }

  /*** INPUT DATA - QUESTIONS ***/

  //variable that stores all the current questions
  $scope.questions = [];

  //variable that holds the question that is selected to be deleted
  $scope.delete_question = '';

  //variable that controls the showing/hiding of the questions
  $scope.questions_eye = 1;

  //add a new question
  $scope.addQuestion = function() {
    if($scope.questions.length == 0)
      $scope.new_question.id = 1;
    else
      $scope.new_question.id = $scope.questions[$scope.questions.length - 1]['id'] + 1;

    $scope.questions.push(angular.copy($scope.new_question));

    $scope.new_question.content = '';
  }

  //delete a certain question
  $scope.deleteQuestion = function(question) {
    $scope.delete_question = question.id;
  }

  //confirm the question deletion
  $scope.confirmDeleteQuestion = function(question) {
    $scope.questions.splice($scope.questions.indexOf(question), 1);
    $scope.delete_question = '';
  }

  //cancel the question deletion
  $scope.cancelDeleteQuestion = function() {
    $scope.delete_question = '';
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
});
