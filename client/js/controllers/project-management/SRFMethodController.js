app.controller('SRFMethodController', function($scope, $window, $http) {
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
  /*$scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
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
  }*/

  //hide successful save message after being dismissed
  $scope.changeSaveSuccess = function() {
    $scope.showSaveSuccess = false;
  }

  //reload the stored data on the database
  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //retrieve the criteria from the database

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
  /*$scope.confirmResetData = function() {
    //reset the input data
    $scope.emails = [];
    $scope.questions = [];
    //hide the reset confirmation and cancelation buttons
    $scope.showResetData = false;
  }*/

  //cancel the data reset
  $scope.cancelResetData = function() {
    //hide the reset confirmation and cancelation buttons
    $scope.showResetData = false;
  }

  /*** IMPORT AND EXPORT FUNCTIONS ***/

  //import the files of the checked boxes
  /*$scope.importData = function() {
    if(angular.element(document.querySelector('#import-emails-check')).prop('checked')) {
      importFile('import-emails-file');
    }
    if(angular.element(document.querySelector('#import-questions-check')).prop('checked')) {
      importFile('import-questions-file');
    }
  }*/

  //import file according to its extension
  /*function importFile(input_id) {
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
  }*/

  //get the converted data as the current data
  /*function fileConverter(input_id, data) {
    switch(input_id) {
      case 'import-emails-file':
        $scope.emails = data;
        break;

      case 'import-questions-file':
        $scope.questions = data;
        break;
    }
  }*/

  //select emails and questions import checkboxes
  /*$scope.selectAllImport = function() {
    document.getElementById('import-emails-check').checked = true;
    document.getElementById('import-questions-check').checked = true;
  }*/

  //deselect emails and questions import checkboxes
  /*$scope.selectNoneImport = function() {
    document.getElementById('import-emails-check').checked = false;
    document.getElementById('import-questions-check').checked = false;
  }*/

  //export the selected data
  /*$scope.exportData = function() {
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
  }*/

  //select emails and questions export checkboxes
  /*$scope.selectAllExport = function() {
    document.getElementById('export-emails-check').checked = true;
    document.getElementById('export-questions-check').checked = true;
  }*/

  //deselect emails and questions export checkboxes
  /*$scope.selectNoneExport = function() {
    document.getElementById('export-emails-check').checked = false;
    document.getElementById('export-questions-check').checked = false;
  }*/

  /*** INPUT DATA - CRITERIA ***/

  //variable that stores all the current criteria
  $scope.criteria = [];

  //variable that holds the criterion that is selected to be deleted
  $scope.delete_criterion = '';

  //variable that controls the showing/hiding of the criteria
  $scope.criteria_eye = 1;

  //add a new criterion
  $scope.addCriterion = function() {
    if($scope.criteria.length == 0)
      $scope.new_criterion.id = 1;
    else
      $scope.new_criterion.id = $scope.criteria[$scope.criteria.length - 1]['id'] + 1;

    //criterion starts unassigned to any rank
    $scope.new_criterion.position = -1;

    $scope.criteria.push(angular.copy($scope.new_criterion));

    $scope.new_criterion.name = '';
  }

  //delete a certain criterion
  $scope.deleteCriterion = function(criterion) {
    $scope.delete_criterion = criterion.id;
  }

  //confirm the criterion deletion
  $scope.confirmDeleteCriterion = function(criterion) {
    $scope.criteria.splice($scope.criteria.indexOf(criterion), 1);
    $scope.delete_criterion = '';
  }

  //cancel the criterion deletion
  $scope.cancelDeleteCriterion = function() {
    $scope.delete_criterion = '';
  }

  /*** INPUT DATA - WHITE CARDS ***/

  //white card available to be dragged
  $scope.white_card = {
    'white_card' : true,
    'id' : 0
  };

  //dragged white cards
  $scope.white_cards = [];

  /*** INPUT DATA - RANKING ***/

  //variable that stores all the current ranking
  $scope.ranking = 2;

  //variable that controls the showing/hiding of the ranking
  $scope.ranking_eye = 1;

  //create an array the size of $scope.ranking so that it can be used by ng-repeat
  $scope.rangeRepeater = function(count) {
    return new Array(count);
  };

  //new row is always the new least important
  $scope.addRanking = function() {
    $scope.ranking++;
  }

  $scope.removeRanking = function() {
    //don't allow less than 2 rankings
    if($scope.ranking > 2)
      $scope.ranking--;

    //check if there were any criteria cards dragged into the deleted ranking
    //if there were, then reset their position
    for(criterion in $scope.criteria)
      if($scope.criteria[criterion]['position'] >= $scope.ranking)
        $scope.criteria[criterion]['position'] = -1;

    //check if there were any white cards dragged into the deleted ranking
    //if there were, then reset their position
    for(white_card in $scope.white_cards)
      if($scope.white_cards[white_card]['position'] >= $scope.ranking)
        $scope.white_cards[white_card]['position'] = -1;
  }

  /*** INPUT DATA - OTHER PARAMETERS ***/

  $scope.ratio_z = '';

  $scope.decimal_places = '';
  
  /*** DRAG AND DROP FUNCTIONS ***/

  //change a card's ranking position
  $scope.rankingDrop = function(data, index) {
    //if the white card on the original drop was dragged
    if(data['white_card'] && data['id'] == 0) {
      var new_white_card = {
        'position' : index,
        'id' : $scope.white_cards.length + 1,
        'white_card' : true
      };

      $scope.$apply($scope.white_cards.push(new_white_card));
    }
    //if a criteria card was dragged
    else
      data['position'] = index;
  }

  //put a criteria card back into the original drop
  $scope.originalCriteriaDrop = function(data) {
    if(data['white_card'] == undefined)
      data['position'] = -1;
  }

  //put a white card back into the original drop
  $scope.originalWhiteDrop = function(data) {
    if(data['white_card'] && data['id'] != 0) {
      data['position'] = -1;
      $scope.$apply($scope.white_cards);
    }
  }

  /*** EXECUTIONS AND RESULTS FUNCTIONS ***/

  //variables that control the showing/hiding of the results tables
  $scope.emails_exec_eye = 1;
  $scope.questions_exec_eye = 1;

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

      //create the new round
      var new_round = {};
      //define the id of the round
      new_round['id'] = id;
      //project this round belongs to
      new_round['project_id'] = proj_id;
      //who created the round
      new_round['username'] = $scope.username;
      //list of emails
      new_round['emails'] = $scope.emails;
      //list of questions
      new_round['questions'] = $scope.questions
      //round comment
      new_round['comment'] = comment;
      //date round was created
      new_round['execution_date'] = execution_date;

      //add the new list of projects
      $http.post('/delphi_rounds', new_round).success(function() {
        //update list of rounds
        getExecutions();

        //create the answer documents
        createAnswerDocs(new_round);

        //send the emails with links to the surveys
        //sendSurveyLinks(new_round);

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
        console.log(response);
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
