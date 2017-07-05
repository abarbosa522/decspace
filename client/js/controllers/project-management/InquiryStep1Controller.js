app.controller('InquiryStep1Controller', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;
  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('round=') + 'round='.length, url.indexOf('&user=')));
  //get the user's email address
  $scope.user_id = url.substr(url.indexOf('&user=') + '&user='.length);


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
    angular.element(document.querySelector('#open-answer-error')).hide();
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

  //save the current data on the database
  $scope.nextStep = function() {
    var answered_all = true;

    for(question in $scope.open_answer_questions)
      if($scope.open_answer_questions[question].answer == '')
        answered_all = false;

    if(answered_all) {
      $http.get('/inquiry_responses').then(function(response) {
        var id_doc, answer_res;

        //get the current answer
        for(answer in response.data) {
          if(response.data[answer].user == $scope.user_id && response.data[answer].round_id == round_id) {
            //store open answer questions
            response.data[answer]['open_answer_questions'] = $scope.open_answer_questions;
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
            //redirect to the next step
            $window.location.href = 'inquiry2.html?round=' + round_id + '&user=' + $scope.user_id;
          });
        });
      });
    }
    else
      showAlert('open-answer-error');
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
