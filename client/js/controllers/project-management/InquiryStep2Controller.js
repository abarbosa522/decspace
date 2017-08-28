app.controller('InquiryStep2Controller', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;
  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('r=') + 'r='.length, url.indexOf('&u=')));
  //get the user's email address
  $scope.user_id = url.substr(url.indexOf('&u=') + '&u='.length);


  //get inquiry project questions
  function getData() {
    //get the stored answers
    $http.get('/inquiry_responses').then(function(response) {
      //get the current answer
      for(answer in response.data) {
        if(response.data[answer].user == $scope.user_id && response.data[answer].round_id == round_id) {
          //get the survey subject
          $scope.subject = response.data[answer].subject;
          //get open answer questions
          $scope.open_answer_questions = response.data[answer].open_answer_questions;
          break;
        }
      }
    });
  }

  //hide the successful save alert
  function hideAlerts() {
    angular.element(document.querySelector('#characterization-alert')).hide();
  }
  
  $scope.hideAlert = function(alert) {
    $('#' + alert).hide();
  }
  
  //save the current data on the database
  $scope.nextStep = function() {
    var answered_all = true;

    for(question in $scope.open_answer_questions)
      if($scope.open_answer_questions[question].answer == '')
        answered_all = false;

    if(answered_all) {
      $http.get('/inquiry_responses').then(function(response) {
        var previous_answer, new_answer;

        //get the current answer
        for(answer in response.data) {
          if(response.data[answer].user == $scope.user_id && response.data[answer].round_id == round_id) {
            delete response.data[answer]['_id'];
            previous_answer = angular.copy(response.data[answer]);

            //store open answer questions
            response.data[answer]['open_answer_questions'] = $scope.open_answer_questions;

            //answer to store in the database
            new_answer = response.data[answer];
            break;
          }
        }

        //delete the previous document
        $http.put('/inquiry_responses', [previous_answer, new_answer]).then(function() {
          //redirect to the next step
          $window.location.href = 'inquiry3.html?r=' + round_id + '&u=' + $scope.user_id;
        });
      });
    }
    else
      $('#characterization-alert').show();
  }

  //redirect to the previous step
  $scope.previousStep = function() {
    $window.location.href = 'inquiry.html?r=' + round_id + '&u=' + $scope.user_id;
  }

  $scope.blurOpenAnswerQuestion = function(quest) {
    if(quest.answer == undefined || quest.answer == '')
      $('#open-answer-question-' + quest.id).addClass('has-error');
    else
      $('#open-answer-question-' + quest.id).removeClass('has-error');
  }

  /*** STARTUP FUNCTIONS ***/
  getData();
  hideAlerts();
});
