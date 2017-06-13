app.controller('InquiryLoginController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;

  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('round=') + 'round='.length));

  //get subject of inquiry
  function getSubject() {
    $http.get('/inquiry_rounds').then(function(response) {
      for(round in response.data)
        if(response.data[round].id == round_id)
          $scope.subject = response.data[round].subject;
    });
  }

  //redirect to the inquiry page
  $scope.startSurvey = function() {
    $http.get('/inquiry_responses').then(function(response) {
      var answer_exists = false;

      for(answer in response.data)
        if(response.data[answer].user == $scope.login.email && response.data[answer].round_id == round_id)
          answer_exists = true;

      if(!answer_exists) {
        $http.get('/inquiry_rounds').then(function(response) {
          for(round in response.data) {
            if(response.data[round].id == round_id) {
              var new_answer = {};

              new_answer.round_id = round_id;
              new_answer.user = $scope.login.email;
              new_answer.subject = angular.copy(response.data[round].subject);
              new_answer.questions_answered = [];
              new_answer.questions_unanswered = [];

              for(question in response.data[round].questions) {
                var new_question = angular.copy(response.data[round].questions[question]);
                new_question.position = -1;
                new_question.score = 'null';
                new_answer.questions_unanswered.push(new_question);
              }

              new_answer.suggestions = [];
              new_answer['suggestions toggle'] = angular.copy(response.data[round]['suggestions toggle']);

              new_answer.usability_metrics = {};
              new_answer.usability_metrics.log_ins = 1;
              new_answer.usability_metrics.log_in_date = '';
              new_answer.usability_metrics.answer_submission_date = '';
              new_answer.usability_metrics.task_duration = '';
              new_answer.usability_metrics.drag_and_drops = 0;
              new_answer.usability_metrics.added_suggestions = 0;
              new_answer.usability_metrics.confirmed_deletion_suggestion = 0;
              new_answer.usability_metrics.canceled_deletion_suggestion = 0;
              new_answer.usability_metrics.data_saves = 0;
              new_answer.usability_metrics.help_modal_open = 0;
              new_answer.usability_metrics.task_complete = false;
              new_answer.usability_metrics.incomplete_saves = 0;

              $http.post('/inquiry_responses', new_answer).then(function() {
                $window.location.href = 'inquiry.html?round=' + round_id + '&user=' + $scope.login.email;
              });
            }
          }
        });
      }
      else
        $window.location.href = 'inquiry.html?round=' + round_id + '&user=' + $scope.login.email;
    });
  }

  getSubject();
});
