app.controller('DelphiMethodController', function($scope, $window, $http, DelphiService) {
  /*** SETUP FUNCTIONS ***/

  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(typeof res.data.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.data.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').then(function(response) {
          for(account in response.data) {
            if(response.data[account].email == $scope.username) {
              $scope.name = response.data[account].name;
              break;
            }
          }
        });
      }
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response.data[proj]['name'];
          //change the date of the last update of the project
          response.data[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //retrieve the data stored in the database
          $scope.reloadData(false);
          getExecutions();
        });
      });
    });
  }

  //hide all alerts
  function hideAlerts() {
    $('#save-success').hide();
    $('#reload-success').hide();
  }

  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    //show alert
    angular.element(document.querySelector('#' + alert_id)).alert();
    //hide alert
    angular.element(document.querySelector('#' + alert_id)).fadeTo(3000, 500).slideUp(500, function(){
      angular.element(document.querySelector('#' + alert_id)).slideUp(500);
    });
  }

  /*** BUTTON BAR FUNCTIONS ***/

  //save the current data on the database
  $scope.saveData = function() {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //store survey subject
          response.data[proj]['subject'] = $scope.subject;
          //store emails
          response.data[proj]['emails'] = $scope.emails;
          //store questions
          response.data[proj]['questions'] = $scope.questions;

          //get the id of the document
          id_doc = response.data[proj]['_id'];
          //project to store in the db
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          showAlert('save-success');
        });
      });
    });
  }

  //reload the stored data on the database
  $scope.reloadData = function(alertShowing) {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //retrieve the survey subject from the database
          if(response.data[proj]['subject'] != undefined)
            $scope.subject = response.data[proj]['subject'];
          //retrieve the list of emails from the database
          if(response.data[proj]['emails'] != undefined)
            $scope.emails = response.data[proj]['emails'];
          //retrieve the list of questions from the database
          if(response.data[proj]['questions'] != undefined)
            $scope.questions = response.data[proj]['questions'];

          if(alertShowing)
            showAlert('reload-success');

          break;
        }
      }
    });
  }

  //confirm reset of the current data
  $scope.confirmResetData = function() {
    //reset the input data
    $scope.emails = [];
    $scope.questions = [];
    $scope.subject = '';
  }

  /*** IMPORT AND EXPORT FUNCTIONS ***/

  //import the files of the checked boxes
  $scope.importData = function() {
    if(angular.element(document.querySelector('#import-subject-check')).prop('checked')) {
      importFile('import-subject-file');
    }
    if(angular.element(document.querySelector('#import-emails-check')).prop('checked')) {
      importFile('import-emails-file');
    }
    if(angular.element(document.querySelector('#import-questions-check')).prop('checked')) {
      importFile('import-questions-file');
    }
  }

  //import file according to its extension
  function importFile(input_id) {
    var file_input = document.getElementById(input_id);

    var reader = new FileReader();

    var data = [];

    //called when readAsText is performed
    reader.onload = (function(file) {
      var file_extension = file.name.split('.').pop();

      //imported file is a csv file
      if(file_extension == 'csv') {
        return function(e) {
          var rows = e.target.result.split("\n");

          for(row in rows)
            rows[row] = rows[row].trim();

          var columns = rows[0].split(";");

          //remove whitespaces and empty strings
          for(column in columns)
            columns[column] = columns[column].trim();

          for(var i = 1; i < rows.length; i++) {
            var cells = rows[i].split(";");
            var element = {};

            //add the unique id
            element['id'] = i;

            for(var j = 0; j < cells.length; j++)
              if(cells[j].trim() != '' && columns[j].trim() != '')
                element[columns[j]] = cells[j];

            if(!angular.equals(element, {}))
              data.push(element);
          }
          $scope.$apply(fileConverter(input_id, data));
        };
      }
      //imported file is a json file
      else if(file_extension == 'json') {
        return function(e) {
          var rows = e.target.result.split("\n");

          for(row in rows) {
            var element = JSON.parse(rows[row]);
            element['id'] = Number(row) + 1;
            data.push(element);
          }

          $scope.$apply(fileConverter(input_id, data));
        }
      }
    })(file_input.files[0]);

    //get the data from the file
    reader.readAsText(file_input.files[0]);
  }

  //get the converted data as the current data
  function fileConverter(input_id, data) {
    switch(input_id) {
      case 'import-subject-file':
        $scope.subject = data[0]['subject'];
        break;
      case 'import-emails-file':
        $scope.emails = data;
        break;
      case 'import-questions-file':
        $scope.questions = data;
        break;
    }
  }

  //select emails and questions import checkboxes
  $scope.selectAllImport = function() {
    document.getElementById('import-subject-check').checked = true;
    document.getElementById('import-emails-check').checked = true;
    document.getElementById('import-questions-check').checked = true;
  }

  //deselect emails and questions import checkboxes
  $scope.selectNoneImport = function() {
    document.getElementById('import-subject-check').checked = false;
    document.getElementById('import-emails-check').checked = false;
    document.getElementById('import-questions-check').checked = false;
  }

  //export the selected data
  $scope.exportData = function() {
    //export subject to csv
    if(angular.element(document.querySelector('#export-subject-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'subject\n' + $scope.subject;

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'subject.csv';
      hidden_element.click();
    }
    //export subject to json
    if(angular.element(document.querySelector('#export-subject-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      var json_element = {};

      json_element['subject'] = $scope.subject;

      json_str += JSON.stringify(json_element) + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'subject.json';
      hidden_element.click();
    }
    //export emails to csv
    if(angular.element(document.querySelector('#export-emails-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'address\n';

      for(email in $scope.emails) {
        csv_str += $scope.emails[email]['address'] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'emails.csv';
      hidden_element.click();
    }
    //export emails to json
    if(angular.element(document.querySelector('#export-emails-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(email in $scope.emails) {
        var json_element = {};

        for(field in $scope.emails[email]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.emails[email][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'emails.json';
      hidden_element.click();
    }
    //export questions to csv
    if(angular.element(document.querySelector('#export-questions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'content\n';

      for(question in $scope.questions) {
        csv_str += $scope.questions[question]['content'] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'questions.csv';
      hidden_element.click();
    }
    //export questions to json
    if(angular.element(document.querySelector('#export-questions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(question in $scope.questions) {
        var json_element = {};

        for(field in $scope.questions[question]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.questions[question][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'questions.json';
      hidden_element.click();
    }
  }

  //select emails and questions export checkboxes
  $scope.selectAllExport = function() {
    document.getElementById('export-subject-check').checked = true;
    document.getElementById('export-emails-check').checked = true;
    document.getElementById('export-questions-check').checked = true;
  }

  //deselect emails and questions export checkboxes
  $scope.selectNoneExport = function() {
    document.getElementById('export-subject-check').checked = false;
    document.getElementById('export-emails-check').checked = false;
    document.getElementById('export-questions-check').checked = false;
  }

  /*** INPUT DATA - SURVEY SUBJECT ***/

  //variable that stores all the current survey subject
  $scope.subject = '';

  //variable that controls the showing/hiding of the subject
  $scope.subject_eye = 1;

  $scope.blurSubject = function() {
    if($scope.subject == undefined || $scope.subject == '')
      $('#subject').addClass('has-error');
    else
      $('#subject').removeClass('has-error');
  }

  /*** INPUT DATA - EMAILS ***/

  //variable that stores all the current email addresses
  $scope.emails = [];

  //variable that holds the email that is selected to be deleted
  $scope.delete_email = '';

  //variable that controls the showing/hiding of the emails
  $scope.emails_eye = 1;

  $scope.new_email = {};

  $scope.addEmail = function() {
    //if there is an input field not assigned
    if($scope.new_email.address == undefined || $scope.new_email.address == '')
      $('#new-email').addClass('has-error');
    else {
      //assign an unique id to the new email
      if($scope.emails.length == 0)
        $scope.new_email.id = 1;
      else
        $scope.new_email.id = $scope.emails[$scope.emails.length - 1]['id'] + 1;

      $scope.emails.push(angular.copy($scope.new_email));

      $scope.new_email.address = '';

      //remove all error classes - just be sure
      $('#new-email').removeClass('has-error');
    }
  }

  $scope.blurEmail = function(email) {
    if(email.address == undefined || email.address == '')
      $('#email-' + email.id).addClass('has-error');
    else
      $('#email-' + email.id).removeClass('has-error');
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

  $scope.new_question = {};

  $scope.addQuestion = function() {
    var can_add_question = true;

    //if a title was not assigned to the new question
    if($scope.new_question.title == undefined || $scope.new_question.title == '') {
      $('#new-question-title').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-question-title').removeClass('has-error');

    //if a description was not assigned to the new question
    if($scope.new_question.description == undefined || $scope.new_question.description == '') {
      $('#new-question-description').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-question-description').removeClass('has-error');

    if(can_add_question) {
      //assign an unique id to the new email
      if($scope.questions.length == 0)
        $scope.new_question.id = 1;
      else
        $scope.new_question.id = $scope.questions[$scope.questions.length - 1]['id'] + 1;

      $scope.questions.push(angular.copy($scope.new_question));

      $scope.new_question.title = '';
      $scope.new_question.description = '';

      //remove all error classes - just be sure
      $('#new-question-title').removeClass('has-error');
      $('#new-question-description').removeClass('has-error');
    }
  }

  $scope.blurQuestionTitle = function(question) {
    if(question.title == undefined || question.title == '')
      $('#question-title-' + question.id).addClass('has-error');
    else
      $('#question-title-' + question.id).removeClass('has-error');
  }

  $scope.blurQuestionDescription = function(question) {
    if(question.description == undefined || question.description == '')
      $('#question-description-' + question.id).addClass('has-error');
    else
      $('#question-description-' + question.id).removeClass('has-error');
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

  /*** EXECUTIONS AND RESULTS FUNCTIONS ***/

  //stores the last id of the executions of the current project
  $scope.current_execution_project_id = 0;

  //variables that control the showing/hiding of the results tables
  $scope.emails_exec_eye = 1;
  $scope.questions_exec_eye = 1;
  $scope.subject_exec_eye = 1;
  $scope.link_exec_eye = 1;
  $scope.suggestions_exec_eye = 1;

  //retrieve the rounds stored in the database
  function getExecutions() {
    //reset list of executions
    $scope.executions = [];

    $http.get('/delphi_rounds').then(function(response) {
      for(round in response.data) {
        if(response.data[round]['username'] == $scope.username && response.data[round]['project_id'] == proj_id) {
          $scope.executions.push(response.data[round]);
        }
      }

      $scope.current_execution_project_id = 0;

      for(execution in $scope.executions)
        if($scope.executions[execution]['execution_project_id'] > $scope.current_execution_project_id)
          $scope.current_execution_project_id = $scope.executions[execution]['execution_project_id'];

      $scope.current_execution_project_id++;
    });
  }

  //variable that shows/hides the loading button
  $scope.isLoading = false;

  //execute the method and return the corresponding results
  $scope.getResults = function() {
    //show loading button
    $scope.isLoading = true;

    $http.get('/delphi_rounds').then(function(response) {
      //get current date
      var current_date = new Date();
      var execution_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear() + ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

      var comment;
      //if a comment has not been added, then define it as an empty string
      if(typeof $scope.new_execution == 'undefined')
        comment = '';
      else
        comment = $scope.new_execution.comment;

      //get the largest round id
      var id = 0;

      for(round in response.data)
        if(response.data[round]['id'] > id)
          id = response.data[round]['id'];

      id++;

      //get the largest execution id in the project context
      var execution_project_id = 0;

      for(execution in $scope.executions)
        if($scope.executions[execution]['execution_project_id'] > execution_project_id)
          execution_project_id = $scope.executions[execution]['execution_project_id'];

      execution_project_id++;

      //create the new round
      var new_round = {};
      //define the id of the round
      new_round['id'] = id;
      //project this round belongs to
      new_round['project_id'] = proj_id;
      //id in the project context
      new_round['execution_project_id'] = execution_project_id;
      //who created the round
      new_round['username'] = $scope.username;
      //list of emails
      new_round['emails'] = $scope.emails;
      //list of questions
      new_round['questions'] = $scope.questions
      //survey subject
      new_round['subject'] = $scope.subject;
      //round comment
      new_round['comment'] = comment;
      //date round was created
      new_round['execution_date'] = execution_date;
      //generate survey link
      new_round['link'] = 'http://vps288667.ovh.net:8082/content/project-management/delphi-login.html?round=' + new_round['id'];

      //add the new list of projects
      $http.post('/delphi_rounds', new_round).then(function() {
        //update list of rounds
        getExecutions();

        //create the answer documents
        createAnswerDocs(new_round);

        //send the emails with links to the surveys
        sendSurveyLinks(new_round);

        //reset the comment input field, if it was filled
        if(typeof $scope.new_execution != 'undefined')
          $scope.new_execution.comment = '';

        //hide loading button
        $scope.isLoading = false;
      });
    });
  }

  function createAnswerDocs(new_round) {
    for(email in new_round['emails']) {
      //create a new answer document
      var new_answer = {};
      //define the corresponding round id
      new_answer['round_id'] = new_round['id'];
      //define the user that created the round
      new_answer['user_creator'] = new_round['username'];
      //define the user that will answer the survey
      new_answer['user'] = new_round['emails'][email]['address'];
      //define the empty set of answers
      new_answer['questions_answered'] = [];
      //define the subject survey
      new_answer['subject'] = new_round['subject'];
      //define the suggestions
      new_answer['suggestions'] = [];
      //define the set of unanswered question
      new_answer['questions_unanswered'] = [];

      //add the position to the questions - corresponding to the drop box they are in
      //-1 means that the question has not been assigned a drop box
      for(question in $scope.questions) {
        var new_question = {};
        new_question['content'] = $scope.questions[question]['content'];
        new_question['id'] = $scope.questions[question]['id'];
        new_question['position'] = -1;
        new_question['score'] = 'null';
        new_answer['questions_unanswered'].push(new_question);
      }

      //usability metrics
      new_answer['usability_metrics'] = {};
      new_answer['usability_metrics']['log_ins'] = 0;
      new_answer['usability_metrics']['task_duration'] = '';
      new_answer['usability_metrics']['drag_and_drops'] = 0;
      new_answer['usability_metrics']['added_suggestions'] = 0;
      new_answer['usability_metrics']['confirmed_deletion_suggestion'] = 0;
      new_answer['usability_metrics']['canceled_deletion_suggestion'] = 0;
      new_answer['usability_metrics']['data_saves'] = 0;
      new_answer['usability_metrics']['confirmed_data_resets'] = 0;
      new_answer['usability_metrics']['canceled_data_resets'] = 0;
      new_answer['usability_metrics']['data_reloads'] = 0;
      new_answer['usability_metrics']['help_modal_open'] = 0;
      new_answer['usability_metrics']['task_complete'] = '';
      new_answer['usability_metrics']['incomplete_saves'] = 0;

      //add the new list of projects
      $http.post('/delphi_responses', new_answer).then(function() {
      });
    }
  }

  function sendSurveyLinks(new_round) {
    for(email in new_round['emails']) {
      $scope.send_email = {};
      $scope.send_email.email = new_round['emails'][email]['address'];
      $scope.send_email.link = 'http://vps288667.ovh.net:8082/content/project-management/delphi-survey.html?round=' + new_round['id'] + '&user=' + new_round['emails'][email]['address'];

      $http.post('/delphi_survey', $scope.send_email).then(function(response) {
      });
    }
  }

  //variable that controls the execution to show
  $scope.currentExecution = '';

  //variable that controls the execution to compare
  $scope.compareExecution = '';

  //show modal with execution details
  $scope.showExecution = function(execution) {
    var results = DelphiService.aggregateResults(execution.id);

    results.then(function(resolve) {

      $scope.currentExecution = execution;

      $scope.currentExecution.questions = resolve[0];

      $scope.currentExecution.emails_answers = resolve[1];

      $scope.currentExecution.suggestions = resolve[2];

      $scope.compareExecution = '';
    });
  }

  //show the execution to compare with
  $scope.showCompareExecution = function(execution) {
    var results = DelphiService.aggregateResults(execution.id);

    results.then(function(resolve) {

      $scope.compareExecution = execution;

      $scope.compareExecution.questions = resolve[0];

      $scope.compareExecution.emails_answers = resolve[1];

      $scope.compareExecution.suggestions = resolve[2];
    });
  }

  //variable that controls the selected execution to be deleted
  $scope.deleteIdExecution = '';

  //select an execution to be deleted
  $scope.deleteExecution = function(execution) {
    $scope.deleteIdExecution = execution.id;
  }

  //confirm execution deletion
  $scope.confirmDeleteExecution = function(execution) {
    $http.get('/delphi_rounds').then(function(response) {
      var id_doc;

      for(round in response.data) {
        if(response.data[round]['username'] == $scope.username && response.data[round]['project_id'] == proj_id && response.data[round]['id'] == execution.id) {
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[round]['_id'];
          break;
        }
      }

      //delete the delphi round
      $http.delete('/delphi_rounds/' + id_doc).then(function() {
        //refresh the list of rounds
        getExecutions();
        //reset id execution variable
        $scope.deleteIdExecution = '';

        //delete the response to this round
        $http.get('/delphi_responses').then(function(response2) {
          var id_res;

          for(res in response2.data) {
            if(response2.data[res]['round_id'] == execution.id) {
              id_res = response2.data[res]['_id'];

              $http.delete('/delphi_responses/' + id_res).then(function() {
              });
            }
          }
        });
      });
    });
  }

  //cancel execution deletion
  $scope.cancelDeleteExecution = function() {
    $scope.deleteIdExecution = '';
  }

  //select all executions to be deleted
  $scope.deleteAllExecutions = function() {
    $scope.deleteIdExecution = 'all';
  }

  //confirm the deletion of all executions of the current project
  $scope.confirmDeleteAllExecutions = function() {
    var list_rounds = [];

    $http.get('/delphi_rounds').then(function(response) {
      for(round in response.data) {
        if(response.data[round]['username'] == $scope.username && response.data[round]['project_id'] == proj_id) {
          //get the id of the document, so that it can be removed from the db
          var id_doc = response.data[round]['_id'];

          //store id of the current round
          list_rounds.push(response.data[round]['id']);

          //delete the delphi round
          $http.delete('/delphi_rounds/' + id_doc).then(function() {
            //refresh the list of rounds
            getExecutions();
            //reset id execution variable
            $scope.deleteIdExecution = '';
          });
        }
      }

      //delete the response to the deleted rounds
      $http.get('/delphi_responses').then(function(response2) {
        var id_res;

        for(res in response2.data) {
          if(list_rounds.includes(response2.data[res]['round_id'])) {
            id_res = response2.data[res]['_id'];

            $http.delete('/delphi_responses/' + id_res).then(function() {
            });
          }
        }
      });
    });
  }

  //cancel the deletion of all executions
  $scope.cancelDeleteAllExecutions = function() {
    $scope.deleteIdExecution = '';
  }

  //order the questions results by a certain attribute in a certain direction
  $scope.changeQuestionsOrder = function(attr, dir, data) {
    if(data == 'currentExecution')
      $scope.currentExecution.questions.sort(sortData(attr, dir));
    else if(data == 'compareExecution')
      $scope.compareExecution.questions.sort(sortData(attr, dir));
  }

  //sort an array by order and direction
  function sortData(attribute, direction) {
    return function(a, b) {
      if(direction == 'ascendant') {
        if(a[attribute] < b[attribute])
          return -1;
        if(a[attribute] > b[attribute])
          return 1;
        return 0;
      }
      else {
        if(a[attribute] < b[attribute])
          return 1;
        if(a[attribute] > b[attribute])
          return -1;
        return 0;
      }
    }
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
