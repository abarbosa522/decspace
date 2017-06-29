app.controller('InquiryController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;
  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('round=') + 'round='.length, url.indexOf('&user=')));
  //get the user's email address
  $scope.user_id = url.substr(url.indexOf('&user=') + '&user='.length);

  //questions defined in the inquiry project still not answered
  $scope.questions_unanswered = [];

  //questions answered
  $scope.questions_answered = [];

  //survey subject
  $scope.subject = '';

  //matrix with the weights
  $scope.matrix = [];

  //get inquiry project questions
  function getData() {
    //get the stored answers
    $http.get('/inquiry_responses').then(function(response) {
      //get the current answer
      for(answer in response.data) {
        if(response.data[answer].user == $scope.user_id && response.data[answer].round_id == round_id) {
          //get the stored answered questions
          $scope.questions_answered = response.data[answer].questions_answered;
          //get the stored unanswered questions
          $scope.questions_unanswered = response.data[answer].questions_unanswered;
          //get the survey subject
          $scope.subject = response.data[answer].subject;
          //get the stored suggestions
          $scope.suggestions = response.data[answer].suggestions;
          //get the suggestions toggle
          $scope.suggestions_toggle = response.data[answer]['suggestions toggle'];
          //get open answer questions
          $scope.open_answer_questions = response.data[answer].open_answer_questions;

          //get survey usability metrics
          log_ins = response.data[answer].usability_metrics.log_ins;
          log_in_date_string = response.data[answer].usability_metrics.log_in_date;
          answer_submission_date = response.data[answer].usability_metrics.answer_submission_date;
          task_duration = response.data[answer].usability_metrics.task_duration;
          drag_and_drops = response.data[answer].usability_metrics.drag_and_drops;
          added_suggestions = response.data[answer].usability_metrics.added_suggestions;
          confirmed_deletion_suggestion = response.data[answer].usability_metrics.confirmed_deletion_suggestion;
          canceled_deletion_suggestion = response.data[answer].usability_metrics.canceled_deletion_suggestion;
          data_saves = response.data[answer].usability_metrics.data_saves;
          help_modal_open = response.data[answer].usability_metrics.help_modal_open;
          task_complete = response.data[answer].usability_metrics.task_complete;
          incomplete_saves = response.data[answer].usability_metrics.incomplete_saves;

          //count current log in
          registerLogIn();

          break;
        }
      }

      //build the q-sort matrix
      buildMatrix();
    });
  }

  function buildMatrix() {
    //determines the number of rows to add
    var i;
    //represents the q-sort matrix
    var rows = [];
    //determines when to stop, i.e. when reaches 0
    var total_rows = $scope.questions_answered.length + $scope.questions_unanswered.length;

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

  //hide the successful save alert
  function hideAlert() {
    angular.element(document.querySelector('#save-success')).hide();
  }

  /*** BUTTON BAR FUNCTIONS ***/

  //variable to show or hide the save success message
  $scope.showSaveSuccess = false;

  //variable to show or hide the confirmation or cancel reset data
  $scope.showResetData = false;

  //save the current data on the database
  $scope.saveData = function() {
    registerTaskDuration();
    registerTaskComplete();
    registerIncompleteSave();

    //increment the counter of data saves
    data_saves++;

    $http.get('/inquiry_responses').then(function(response) {
      var id_doc, answer_res;

      //get the current answer
      for(answer in response.data) {
        if(response.data[answer].user == $scope.user_id && response.data[answer].round_id == round_id) {
          //store answered questions
          response.data[answer]['questions_answered'] = $scope.questions_answered;
          //store unanswered questions
          response.data[answer]['questions_unanswered'] = $scope.questions_unanswered;
          //store suggestions
          response.data[answer]['suggestions'] = $scope.suggestions;
          //store open answer questions
          response.data[answer]['open_answer_questions'] = $scope.open_answer_questions;
          //store usability metrics
          response.data[answer]['usability_metrics']['log_ins'] = log_ins;
          response.data[answer]['usability_metrics']['log_in_date'] = log_in_date_string;
          response.data[answer]['usability_metrics']['answer_submission_date'] = answer_submission_date;
          response.data[answer]['usability_metrics']['task_duration'] = task_duration;
          response.data[answer]['usability_metrics']['drag_and_drops'] = drag_and_drops;
          response.data[answer]['usability_metrics']['added_suggestions'] = added_suggestions;
          response.data[answer]['usability_metrics']['confirmed_deletion_suggestion'] = confirmed_deletion_suggestion;
          response.data[answer]['usability_metrics']['canceled_deletion_suggestion'] = canceled_deletion_suggestion;
          response.data[answer]['usability_metrics']['data_saves'] = data_saves;
          response.data[answer]['usability_metrics']['help_modal_open'] = help_modal_open;
          response.data[answer]['usability_metrics']['task_complete'] = task_complete;
          response.data[answer]['usability_metrics']['incomplete_saves'] = incomplete_saves;
          //get the id of the document
          id_doc = response.data[answer]['_id'];
          //answer to store in the database
          answer_res = response.data[answer];
          delete answer_res['_id'];
          break;
        }
      }

      //delete the previous document
      $http.delete('/inquiry_responses/' + id_doc).then(function() {
        //add the new answers
        $http.post('/inquiry_responses', answer_res).then(function() {
          $scope.showSaveSuccess = true;

          //show save success alert
          angular.element(document.querySelector('#save-success')).alert();
          //smoothly hide success alert
          angular.element(document.querySelector('#save-success')).fadeTo(2000, 500).slideUp(500, function(){
               angular.element(document.querySelector('#save-success')).slideUp(500);
          });
        });
      });
    });
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

    //increment the drag and drop counter - usability metric
    drag_and_drops++;
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

  /*** INPUT DATA - SUGGESTIONS ***/

  //variable that stores all the current suggestions
  $scope.suggestions = [];

  //variable that holds the suggestion that is selected to be deleted
  $scope.delete_suggestion = '';

  $scope.new_suggestion = {};

  //add a new suggestion
  $scope.addSuggestion = function() {
    var can_add_question = true;

    //if a title was not assigned to the new suggestion
    if($scope.new_suggestion.title == undefined || $scope.new_suggestion.title == '') {
      $('#new-suggestion-title').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-suggestion-title').removeClass('has-error');

    //if a description was not assigned to the new suggestion
    if($scope.new_suggestion.description == undefined || $scope.new_suggestion.description == '') {
      $('#new-suggestion-description').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-suggestion-description').removeClass('has-error');

    if(can_add_question) {
      if($scope.suggestions.length == 0)
        $scope.new_suggestion.id = 1;
      else
        $scope.new_suggestion.id = $scope.suggestions[$scope.suggestions.length - 1]['id'] + 1;

      $scope.suggestions.push(angular.copy($scope.new_suggestion));

      $scope.new_suggestion.title = '';
      $scope.new_suggestion.description = '';

      //remove all error classes - just be sure
      $('#new-suggestion-title').removeClass('has-error');
      $('#new-suggestion-description').removeClass('has-error');

      //increment the counter of added suggestions - usability metrics
      added_suggestions++;
    }
  }

  //delete a certain suggestion
  $scope.deleteSuggestion = function(suggestion) {
    $scope.delete_suggestion = suggestion.id;
  }

  //confirm the suggestion deletion
  $scope.confirmDeleteSuggestion = function(suggestion) {
    $scope.suggestions.splice($scope.suggestions.indexOf(suggestion), 1);
    $scope.delete_suggestion = '';

    //increment the counter of suggestion confirmed deletions
    confirmed_deletion_suggestion++;
  }

  //cancel the suggestion deletion
  $scope.cancelDeleteSuggestion = function() {
    $scope.delete_suggestion = '';

    //increment the counter of suggestion canceled deletions
    canceled_deletion_suggestion++;
  }

  $scope.blurSuggestionTitle = function(suggestion) {
    if(suggestion.title == undefined || suggestion.title == '')
      $('#suggestion-title-' + suggestion.id).addClass('has-error');
    else
      $('#suggestion-title-' + suggestion.id).removeClass('has-error');
  }

  $scope.blurSuggestionDescription = function(suggestion) {
    if(suggestion.description == undefined || suggestion.description == '')
      $('#suggestion-description-' + suggestion.id).addClass('has-error');
    else
      $('#suggestion-description-' + suggestion.id).removeClass('has-error');
  }

  $scope.blurOpenAnswerQuestion = function(quest) {
    if(quest.answer == undefined || quest.answer == '')
      $('#open-answer-question-' + quest.id).addClass('has-error');
    else
      $('#open-answer-question-' + quest.id).removeClass('has-error');
  }

  /*** USABILITY METRICS ***/

  //number of times the user logged in
  var log_ins;
  //date of current log in
  var log_in_date_string, log_in_date_time;
  //date of the submission
  var answer_submission_date;
  //time the user took from logging in to last save
  var task_duration;
  //number of times the user dragged and dropped
  var drag_and_drops;
  //number of added suggestions
  var added_suggestions;
  //confirmed suggestion deletions
  var confirmed_deletion_suggestion;
  //canceled suggestion deletions
  var canceled_deletion_suggestion;
  //number of data saves
  var data_saves;
  //number of times the user used the help modal
  var help_modal_open;
  //was the user able to complete the task
  var task_complete;
  //how many saves had complete answers
  var incomplete_saves;

  function registerLogIn() {
    //increment log_ins variable to count the current log in
    log_ins++;
    //get current date
    var current_date = new Date();
    log_in_date_string = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
    log_in_date_string += ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

    log_in_date_time = current_date;
  }

  function registerTaskDuration() {
    var current_date = new Date();
    answer_submission_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
    answer_submission_date += ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

    //convert difference to minutes
    task_duration = Math.round((((current_date -  log_in_date_time) % 86400000) % 3600000) / 60000);
  }

  $scope.registerHelpModalOpen = function() {
    help_modal_open++;
  }

  function registerTaskComplete() {
    if($scope.questions_unanswered.length == 0)
      task_complete = true;
    else
      task_complete = false;
  }

  function registerIncompleteSave() {
    if(!task_complete)
      incomplete_saves++;
  }

  $scope.setFontSize = function(string) {
    if(string.length <= 25)
      return 'very_large_font';
    if(string.length > 25 && string.length <= 55)
      return 'large_font';
    else if(string.length > 55 && string.length <= 75)
      return 'medium_font';
    else if(string.length > 75)
      return 'small_font';
  }

  /*** STARTUP FUNCTIONS ***/
  getData();
  hideAlert();
});
