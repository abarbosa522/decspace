app.controller('DelphiSurveyController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;
  //get the delphi project id
  var proj_id = url.slice(url.indexOf('project=') + 'project='.length, url.indexOf('&exec='));
  //get the delphi round (execution) id
  var exec_id = Number(url.slice(url.indexOf('&exec=') + '&exec='.length, url.indexOf('&user=')));
  //get the user's email address
  $scope.user_id = url.substr(url.indexOf('&user=') + '&user='.length);

  //questions defined in the delphi project still not answered
  $scope.questions_unanswered = [];

  //questions answered
  $scope.questions_answered = [];

  //matrix with the weights
  $scope.matrix = [];

  //get delphi project questions
  function getQuestions() {
    $http.get('/projects').success(function(response) {
      //get the delphi project
      for(proj in response)
        if(response[proj]['_id'] == proj_id)
          for(exec in response[proj]['executions'])
            if(response[proj]['executions'][exec]['id'] == exec_id)
              $scope.questions_unanswered = response[proj]['executions'][exec]['questions'];

      //add the position to the questions - corresponding to the drop box they are in
      //-1 means that the question has not been assigned a drop box
      for(question in $scope.questions_unanswered) {
        $scope.questions_unanswered[question]['position'] = -1;
        $scope.questions_unanswered[question]['score'] = 'null';
      }

      buildMatrix();
    });
  }

  function buildMatrix() {
    //determines the number of rows to add
    var i;
    //represents the q-sort matrix
    var rows = [];
    //determines when to stop, i.e. when reaches 0
    var total_rows = $scope.questions_unanswered.length;

    //calculate the number of rows and the number of parcels in each row
    while(total_rows > 0) {
      var new_row = Math.floor(2 * Math.sqrt(total_rows) - 1);

      if(new_row % 2 == 0)
        new_row--;
      else if(new_row == -1)
        new_row = 1;

      rows.push(new_row);
      total_rows -= new_row;
    }

    for(row in rows) {
      var new_row = [];
      for(i = - Math.floor(rows[row]/2); i <= Math.floor(rows[row]/2); i++) {
        if(i == -0)
          i = 0;

        new_row.push(i);
      }
      $scope.matrix.push(new_row);
    }

    for(row in $scope.matrix) {
      while($scope.matrix[row].length < $scope.matrix[0].length) {
        $scope.matrix[row].unshift('null');
        $scope.matrix[row].push('null');
      }
    }
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

  //reload the stored data on the database
  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
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
    //hide the reset confirmation and cancelation buttons
    $scope.showResetData = false;
  }

  //cancel the data reset
  $scope.cancelResetData = function() {
    //hide the reset confirmation and cancelation buttons
    $scope.showResetData = false;
  }

  /*** DRAG AND DROP FUNCTIONS ***/

  //assign the drop box position to the question
  $scope.onDropComplete = function(data, row, index) {
    //check if position (row-index) is already filled
    var filled_pos = false;
    var question_pos;

    for(question in $scope.questions_answered)
      if($scope.questions_answered[question]['position'] == $scope.matrix.indexOf(row) + '-' + index) {
        question_pos = question;
        filled_pos = true;
        break;
      }

    //if dragged question is unanswered and position is not filled
    if($scope.questions_unanswered.indexOf(data) != -1 && !filled_pos) {
      //add position and score to the question
      $scope.questions_unanswered[$scope.questions_unanswered.indexOf(data)]['position'] = $scope.matrix.indexOf(row) + '-' + index;
      $scope.questions_unanswered[$scope.questions_unanswered.indexOf(data)]['score'] = $scope.matrix[$scope.matrix.indexOf(row)][index];
      //add the question to the answered set of questions
      $scope.questions_answered.push($scope.questions_unanswered[$scope.questions_unanswered.indexOf(data)]);
      //remove the answered question from the unanswered set of questions
      $scope.questions_unanswered.splice($scope.questions_unanswered.indexOf(data), 1);
    }
    //if dragged question is unanswered and position is filled
    else if($scope.questions_unanswered.indexOf(data) != -1 && filled_pos) {
      //reset the position and score of the answered question
      $scope.questions_answered[question_pos]['position'] = -1;
      $scope.questions_answered[question_pos]['score'] = 'null';
      //add the question to the unanswered set of questions
      $scope.questions_unanswered.push($scope.questions_answered[question_pos]);
      //sort the questions by id
      $scope.questions_unanswered.sort(sortById);
      //remove the question from the answered set of questions
      $scope.questions_answered.splice(question_pos, 1);

      //add position and score to the question
      $scope.questions_unanswered[$scope.questions_unanswered.indexOf(data)]['position'] = $scope.matrix.indexOf(row) + '-' + index;
      $scope.questions_unanswered[$scope.questions_unanswered.indexOf(data)]['score'] = $scope.matrix[$scope.matrix.indexOf(row)][index];
      //add the question to the answered set of questions
      $scope.questions_answered.push($scope.questions_unanswered[$scope.questions_unanswered.indexOf(data)]);
      //remove the answered question from the unanswered set of questions
      $scope.questions_unanswered.splice($scope.questions_unanswered.indexOf(data), 1);
    }
    else if($scope.questions_unanswered.indexOf(data) == -1 && !filled_pos) {
      //change the answered question's position and score
      $scope.questions_answered[$scope.questions_answered.indexOf(data)]['position'] = $scope.matrix.indexOf(row) + '-' + index;
      $scope.questions_answered[$scope.questions_answered.indexOf(data)]['score'] = $scope.matrix[$scope.matrix.indexOf(row)][index];
    }
    else if($scope.questions_unanswered.indexOf(data) == -1 && filled_pos) {
      //save and switch the answered questions' positions and scores with each other
      var pos1 = $scope.questions_answered[$scope.questions_answered.indexOf(data)]['position'];
      var score1 = $scope.questions_answered[$scope.questions_answered.indexOf(data)]['score'];
      var pos2 = $scope.questions_answered[question_pos]['position'];
      var score2 = $scope.questions_answered[question_pos]['score'];

      $scope.questions_answered[$scope.questions_answered.indexOf(data)]['position'] = pos2;
      $scope.questions_answered[$scope.questions_answered.indexOf(data)]['score'] = score2;

      $scope.questions_answered[question_pos]['position'] = pos1;
      $scope.questions_answered[question_pos]['score'] = score1;
    }
  }

  //sort an array of objects by the ids
  function sortById(a,b) {
    if(a.id < b.id)
      return -1;
    if(a.id > b.id)
      return 1;
    return 0;
  }

  $scope.checkQuestionPosition = function(question, row, index) {
    if(question['position'] == $scope.matrix.indexOf(row) + '-' + index)
      return true;
    else
      return false;
  }

  /*** STARTUP FUNCTIONS ***/
  getQuestions();
});
