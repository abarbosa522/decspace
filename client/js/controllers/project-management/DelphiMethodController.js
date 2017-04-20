app.controller('DelphiMethodController', function($scope, $window, $http, DelphiService) {
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
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          //retrieve the data stored in the database
          $scope.reloadData();
          getExecutions();
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
          //store survey subject
          response[proj]['subject'] = $scope.subject;
          //store emails
          response[proj]['emails'] = $scope.emails;
          //store questions
          response[proj]['questions'] = $scope.questions;

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

  //hide successful save message after being dismissed
  $scope.changeSaveSuccess = function() {
    $scope.showSaveSuccess = false;
  }

  //reload the stored data on the database
  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //retrieve the survey subject from the database
          if(response[proj]['subject'] != undefined)
            $scope.subject = response[proj]['subject'];
          //retrieve the list of emails from the database
          if(response[proj]['emails'] != undefined)
            $scope.emails = response[proj]['emails'];
          //retrieve the list of questions from the database
          if(response[proj]['questions'] != undefined)
            $scope.questions = response[proj]['questions'];

          break;
        }
      }
    });
  }

  //show confirmation and cancel buttons for resetting the current data
  $scope.resetData = function() {
    $scope.showResetData = true;
  }

  //confirm reset of the current data
  $scope.confirmResetData = function() {
    //reset the input data
    $scope.emails = [];
    $scope.questions = [];
    $scope.subject = '';

    //hide the reset confirmation and cancelation buttons
    $scope.showResetData = false;
  }

  //cancel the data reset
  $scope.cancelResetData = function() {
    //hide the reset confirmation and cancelation buttons
    $scope.showResetData = false;
  }

  /*** IMPORT AND EXPORT FUNCTIONS ***/

  //import the files of the checked boxes
  $scope.importData = function() {
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
    document.getElementById('import-emails-check').checked = true;
    document.getElementById('import-questions-check').checked = true;
  }

  //deselect emails and questions import checkboxes
  $scope.selectNoneImport = function() {
    document.getElementById('import-emails-check').checked = false;
    document.getElementById('import-questions-check').checked = false;
  }

  //export the selected data
  $scope.exportData = function() {
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
    document.getElementById('export-emails-check').checked = true;
    document.getElementById('export-questions-check').checked = true;
  }

  //deselect emails and questions export checkboxes
  $scope.selectNoneExport = function() {
    document.getElementById('export-emails-check').checked = false;
    document.getElementById('export-questions-check').checked = false;
  }

  /*** INPUT DATA - SURVEY SUBJECT ***/

  //variable that stores all the current survey subject
  $scope.subject = '';

  //variable that controls the showing/hiding of the subject
  $scope.subject_eye = 1;

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
    $scope.new_question.description = '';
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

    $http.get('/delphi_rounds').success(function(response) {
      for(round in response) {
        if(response[round]['username'] == $scope.username && response[round]['project_id'] == proj_id) {
          $scope.executions.push(response[round]);
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

    $http.get('/delphi_rounds').success(function(response) {
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

      for(round in response)
        if(response[round]['id'] > id)
          id = response[round]['id'];

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
      new_round['link'] = 'http://vps288667.ovh.net:8082/content/project-management/delphi-survey.html?round=' + new_round['id'];

      //add the new list of projects
      $http.post('/delphi_rounds', new_round).success(function() {
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

      //add the new list of projects
      $http.post('/delphi_responses', new_answer).success(function() {
      });
    }
  }

  function sendSurveyLinks(new_round) {
    for(email in new_round['emails']) {
      $scope.send_email = {};
      $scope.send_email.email = new_round['emails'][email]['address'];
      $scope.send_email.link = 'http://vps288667.ovh.net:8082/content/project-management/delphi-survey.html?round=' + new_round['id'] + '&user=' + new_round['emails'][email]['address'];

      $http.post('/delphi_survey', $scope.send_email).success(function(response) {
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
    $http.get('/delphi_rounds').success(function(response) {
      var id_doc;

      for(round in response) {
        if(response[round]['username'] == $scope.username && response[round]['project_id'] == proj_id && response[round]['id'] == execution.id) {
          //get the id of the document, so that it can be removed from the db
          id_doc = response[round]['_id'];
          break;
        }
      }

      //delete the delphi round
      $http.delete('/delphi_rounds/' + id_doc).success(function() {
        //refresh the list of rounds
        getExecutions();
        //reset id execution variable
        $scope.deleteIdExecution = '';

        //delete the response to this round
        $http.get('/delphi_responses').success(function(response2) {
          var id_res;

          for(res in response2) {
            if(response2[res]['round_id'] == execution.id) {
              id_res = response2[res]['_id'];

              $http.delete('/delphi_responses/' + id_res).success(function() {
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

    $http.get('/delphi_rounds').success(function(response) {
      for(round in response) {
        if(response[round]['username'] == $scope.username && response[round]['project_id'] == proj_id) {
          //get the id of the document, so that it can be removed from the db
          var id_doc = response[round]['_id'];

          //store id of the current round
          list_rounds.push(response[round]['id']);

          //delete the delphi round
          $http.delete('/delphi_rounds/' + id_doc).success(function() {
            //refresh the list of rounds
            getExecutions();
            //reset id execution variable
            $scope.deleteIdExecution = '';
          });
        }
      }

      //delete the response to the deleted rounds
      $http.get('/delphi_responses').success(function(response2) {
        var id_res;

        for(res in response2) {
          if(list_rounds.includes(response2[res]['round_id'])) {
            id_res = response2[res]['_id'];

            $http.delete('/delphi_responses/' + id_res).success(function() {
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

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
});
