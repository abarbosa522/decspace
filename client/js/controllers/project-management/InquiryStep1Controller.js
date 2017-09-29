app.controller('InquiryStep1Controller', function($scope, $window, $http) {
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
          //get the glossary
          $scope.glossary = response.data[answer].glossary;
          //get the description
          $scope.description = response.data[answer].description;
          //
          $scope.ask_characterization_questions = response.data[answer].ask_characterization_questions;
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
    //redirect to the next step
    if($scope.ask_characterization_questions == 'Yes')
      $window.location.href = 'inquiry2.html?r=' + round_id + '&u=' + $scope.user_id;
    else if($scope.ask_characterization_questions == 'No')
      $window.location.href = 'inquiry3.html?r=' + round_id + '&u=' + $scope.user_id;
  }

  /*** STARTUP FUNCTIONS ***/
  getData();
  hideAlerts();
});
