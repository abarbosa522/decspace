app.controller('InquiryStep3Controller', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;
  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('r=') + 'r='.length, url.indexOf('&u=')));
  //get the user's email address
  $scope.user_id = url.substr(url.indexOf('&u=') + '&u='.length);

  //list of questions
  $scope.questions = [];

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

          //get the list of questions
          $scope.questions = response.data[answer].questions;
          //get the survey subject
          $scope.subject = response.data[answer].subject;
          //description
          $scope.description = response.data[answer].description;
          //get the stored suggestions
          $scope.suggestions = response.data[answer].suggestions;
          //get the suggestions toggle
          $scope.suggestions_toggle = response.data[answer].suggestions_toggle;
          //get the user-defined color scheme
          $scope.color_scheme = response.data[answer].color_scheme;
          //glossary
          $scope.glossary = response.data[answer].glossary;
          //scale
          $scope.scale = response.data[answer].scale;
          //answer characterization questions
          $scope.ask_characterization_questions = response.data[answer].ask_characterization_questions;
          
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

          //define the color scheme
          defineColorScheme();
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
    var total_rows = $scope.questions.length;

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

  //save the current data on the database
  $scope.saveData = function() {
    registerTaskDuration();
    registerTaskComplete();
    registerIncompleteSave();

    //increment the counter of data saves
    data_saves++;

    $http.get('/inquiry_responses').then(function(response) {
      var previous_answer, new_answer;

      //get the current answer
      for(answer in response.data) {
        if(response.data[answer].user == $scope.user_id && response.data[answer].round_id == round_id) {
          delete response.data[answer]['_id'];
          previous_answer = angular.copy(response.data[answer]);

          //store answered questions
          response.data[answer].questions = $scope.questions;
          //store suggestions
          response.data[answer]['suggestions'] = $scope.suggestions;
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

          //answer to store in the database
          new_answer = response.data[answer];
          break;
        }
      }

      //update answer
      $http.put('/inquiry_responses', [previous_answer, new_answer]).then(function() {
        //show save success alert
        $('#data-submit-modal').modal('show');
      });
    });
  }

  /*** DRAG AND DROP FUNCTIONS ***/

  //assign the drop box position to the question
  $scope.onDropComplete = function(data, row, index) {
    //check if position (row-index) is already filled
    var filled_pos = false;
    var question_pos;

    for(question in $scope.questions)
      if($scope.questions[question].position == $scope.matrix.indexOf(row) + '-' + index) {
        question_pos = question;
        filled_pos = true;
        break;
      }

    //if dragged question is unanswered and position is not filled
    if(data.position == -1 && !filled_pos) {
      //add position and score to the question
      $scope.questions[$scope.questions.indexOf(data)].position = $scope.matrix.indexOf(row) + '-' + index;
      $scope.questions[$scope.questions.indexOf(data)].score = convertToScale($scope.matrix[$scope.matrix.indexOf(row)][index]);
    }
    //if dragged question is unanswered and position is filled
    else if(data.position == -1 && filled_pos) {
      //reset the position and score of the answered question
      $scope.questions[question_pos].position = -1;
      $scope.questions[question_pos].score = 'null';
      //sort the questions by id
      $scope.questions.sort(sortById);

      //add position and score to the question
      $scope.questions[$scope.questions.indexOf(data)].position = $scope.matrix.indexOf(row) + '-' + index;
      $scope.questions[$scope.questions.indexOf(data)].score = convertToScale($scope.matrix[$scope.matrix.indexOf(row)][index]);
    }
    else if(data.position != -1 && !filled_pos) {
      //change the answered question's position and score
      $scope.questions[$scope.questions.indexOf(data)].position = $scope.matrix.indexOf(row) + '-' + index;
      $scope.questions[$scope.questions.indexOf(data)].score = convertToScale($scope.matrix[$scope.matrix.indexOf(row)][index]);
    }
    else if(data.position != -1 && filled_pos) {
      //save and switch the answered questions' positions and scores with each other
      var pos1 = angular.copy($scope.questions[$scope.questions.indexOf(data)].position);
      var score1 = angular.copy($scope.questions[$scope.questions.indexOf(data)].score);
      var pos2 = angular.copy($scope.questions[question_pos].position);
      var score2 = angular.copy($scope.questions[question_pos].score);

      $scope.questions[$scope.questions.indexOf(data)].position = pos2;
      $scope.questions[$scope.questions.indexOf(data)].score = score2;

      $scope.questions[question_pos].position = pos1;
      $scope.questions[question_pos].score = score1;
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
    if(question.position == $scope.matrix.indexOf(row) + '-' + index)
      return true;
    else
      return false;
  }

  $scope.resetDrop = function(question, data) {
    if(question.id == data.id) {
      $scope.questions[$scope.questions.indexOf(question)].position = -1;
      $scope.questions[$scope.questions.indexOf(question)].score = 'null';
    }
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
    task_complete = true;

    for(question in $scope.questions) {
      if($scope.questions[question].position == -1 && $scope.questions[question].score == 'null') {
        task_complete = false;
        break;
      }
    }
  }

  function registerIncompleteSave() {
    if(!task_complete)
      incomplete_saves++;
  }

  $scope.setFontSize = function(string) {
    if(string.length <= 10)
      return 'jumbo_large_font';
    else if(string.length > 10 && string.length <= 25)
      return 'extremely_large_font';
    else if(string.length > 25 && string.length <= 40)
      return 'very_large_font';
    else if(string.length > 40 && string.length <= 50)
      return 'large_font';
    else if(string.length > 50 && string.length <= 75)
      return 'medium_font';
    else if(string.length > 75)
      return 'small_font';
  }

  //define the classes of the rectangles
  function defineColorScheme() {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.most_important_drop {background : ' + hexToRgbA($scope.color_scheme.most_important) + '}'
    + '.neutral_drop {background : ' + hexToRgbA($scope.color_scheme.neutral) + '}'
    + '.least_important_drop {background : ' + hexToRgbA($scope.color_scheme.least_important) + '}';

    document.getElementsByTagName('head')[0].appendChild(style);
  }

  function hexToRgbA(hex) {
    var c = hex.substring(1).split('');

    if(c.length == 3)
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];

    c = '0x' + c.join('');

    return 'rgba(' + [(c>>16)&255, (c>>8)&255, c&255].join(',') + ', 0.5)';
  }

  //redirect to the previous step
  $scope.previousStep = function() {
    if($scope.ask_characterization_questions == 'Yes')
      $window.location.href = 'inquiry2.html?r=' + round_id + '&u=' + $scope.user_id;
    else if($scope.ask_characterization_questions == 'No')
      $window.location.href = 'inquiry.html?r=' + round_id + '&u=' + $scope.user_id;
  }

  $scope.scaleCheck = function(pos) {
    if($scope.scale == 'Default')
      return true;
    else if($scope.scale == '3 values') {
      if(Math.abs(pos) <= 1)
        return true;
      else
        return false;
    }
  }

  //convert matrix score to current scale
  function convertToScale(score) {
    if($scope.scale == 'Default')
      return score;
    else if($scope.scale == '3 values') {
      if(score >= 1)
        return 1;
      else if(score == 0)
        return 0;
      else if(score <= -1)
        return -1;
    }
  }
  
  /*** 3 SCALES FUNCTIONS ***/
  $scope.getNumberOfNegativePositions = function() {
    //count the number of negative positions 
    var cont_negative = 0;
    
    for(row in $scope.matrix)
      for(position in $scope.matrix[row])
        if($scope.matrix[row][position] <= -1)
          cont_negative++;
    
    //create the array of the negative positions
    $scope.negative_positions = [];
    
    for(var i = 0; i < cont_negative; i++)
      $scope.negative_positions.push('');
    
    return new Array(cont_negative);
  }
  
  $scope.getNumberOfNeutralPositions = function() {
    //count the number of neutral positions
    var cont_neutral = 0;
    
    for(row in $scope.matrix)
      for(position in $scope.matrix[row])
        if($scope.matrix[row][position] == 0)
          cont_neutral++;
    
    //create the array of the neutral positions
    $scope.neutral_positions = [];
    
    for(var i = 0; i < cont_neutral; i++)
      $scope.neutral_positions.push('');
    
    return new Array(cont_neutral);
  }
  
  $scope.getNumberOfPositivePositions = function() {
    //count the number of positive positions
    var cont_positive = 0;
    
    for(row in $scope.matrix)
      for(position in $scope.matrix[row])
        if($scope.matrix[row][position] >= 1)
          cont_positive++;
    
    //create the array of the positive positions
    $scope.positive_positions = [];
    
    for(var i = 0; i < cont_positive; i++)
      $scope.positive_positions.push('');
    
    return new Array(cont_positive);
  }
  
  //assign the drop box position to the question
  $scope.onDrop3Values = function(data, index, value_position) {
    //get the respective array of positions and score
    var positions_array = [], score;
    
    if(value_position == 'negative')
      score = -1;
    else if(value_position == 'neutral')
      score = 0;
    else if(value_position == 'positive')
      score = 1;
    
    //check if the position is already filled and, if it is, get the correspondant question
    var filled_pos = false, question_pos;

    for(question in $scope.questions)
      if($scope.questions[question].position == (value_position + '-' + index)) {
        question_pos = question;
        filled_pos = true;
        break;
      }

    //if dragged question is unanswered and position is not filled
    if(!filled_pos) {
      //add position and score to the question
      $scope.questions[$scope.questions.indexOf(data)].position = value_position + '-' + index;
      $scope.questions[$scope.questions.indexOf(data)].score = score;
    }
    //if dragged question is unanswered and position is filled
    else if(data.position == -1 && filled_pos) {
      //reset the position and score of the answered question
      $scope.questions[question_pos].position = -1;
      $scope.questions[question_pos].score = 'null';
      //sort the questions by id
      $scope.questions.sort(sortById);

      //add position and score to the question
      $scope.questions[$scope.questions.indexOf(data)].position = value_position + '-' + index;
      $scope.questions[$scope.questions.indexOf(data)].score = score;
    }
    else if(data.position != -1 && filled_pos) {
      //save and switch the answered questions' positions and scores with each other
      var pos1 = angular.copy($scope.questions[$scope.questions.indexOf(data)].position);
      var score1 = angular.copy($scope.questions[$scope.questions.indexOf(data)].score);
      var pos2 = angular.copy($scope.questions[question_pos].position);
      var score2 = angular.copy($scope.questions[question_pos].score);

      $scope.questions[$scope.questions.indexOf(data)].position = pos2;
      $scope.questions[$scope.questions.indexOf(data)].score = score2;

      $scope.questions[question_pos].position = pos1;
      $scope.questions[question_pos].score = score1;
    }
    
    //increment the drag and drop counter - usability metric
    drag_and_drops++;
  }
  
  $scope.checkQuestionPos3Values = function(question, index, value_position) {
    if(question.position == value_position + '-' + index)
      return true;
    else
      return false;
  }
  
  $scope.redirectToFinalPage = function() {
    $window.location.href = 'inquiry4.html?r=' + round_id + '&u=' + $scope.user_id;
  }
  
  /*** STARTUP FUNCTIONS ***/
  getData();
});
