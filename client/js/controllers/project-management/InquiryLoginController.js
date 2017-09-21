app.controller('InquiryLoginController', function($scope, $window, $http, InquiryService) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;

  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('r=') + 'r='.length));
  
  //alerts array
  var alerts = ['registered-alert', 'rejected-alert', 'fields-alert'];
  
  $scope.login = {};
  
  //get subject of inquiry
  function getSubject() {
    $http.get('/inquiry_rounds').then(function(response) {
      for(round in response.data)
        if(response.data[round].id == round_id) {
          $scope.subject = response.data[round].subject;
          $scope.inquiry_owner = response.data[round].username;
          $scope.ask_characterization_questions = response.data[round].ask_characterization_questions_survey_link;
        }
    });
  }

  //redirect to the inquiry page
  $scope.startSurvey = function() {
    var can_start_survey = true;
    
    if($scope.login.name == undefined || $scope.login.name == '') {
      can_start_survey = false;
      $('#input-name').addClass('has-error');
    }
    else
      $('#input-name').removeClass('has-error');
    
    if($scope.login.email == undefined || $scope.login.email == '') {
      can_start_survey = false;
      $('#input-email').addClass('has-error');
    }
    else
      $('#input-email').removeClass('has-error');
    
    if($scope.login.affiliation == undefined || $scope.login.affiliation == '') {
      can_start_survey = false;
      $('#input-affiliation').addClass('has-error');
    }
    else
      $('#input-affiliation').removeClass('has-error');
    
    if(!can_start_survey)
      showAlert('fields-alert');
    else {
      $http.get('/inquiry_responses').then(function(response) {
        var answer_exists = false, response_status;

        for(answer in response.data)
          if(response.data[answer].user == $scope.login.email && response.data[answer].round_id == round_id) {
            answer_exists = true;
            response_status = response.data[answer].status;
            break;
          }

        //if answer does not exist, send email to the survey owner for a confirmation
        if(!answer_exists) {
          showAlert('registered-alert');

          //object to post
          var new_expert = {
            'receiver' : $scope.inquiry_owner,
            'email' : $scope.login.email,
            'name' : $scope.login.name,
            'affiliation' : $scope.login.affiliation
          };

          $http.post('/inquiry_new_expert', new_expert).then(function() {
            $http.get('/inquiry_rounds').then(function(response) {
              for(round in response.data)
                if(response.data[round].id == round_id) {
                  InquiryService.createAnswerData(response.data[round], new_expert.email, new_expert.name, new_expert.affiliation, 'pending', false, $scope.ask_characterization_questions);
                  break;
                }
            });
          });
        }
        else if(response_status == 'pending')
          showAlert('registered-alert');
        else if(response_status == 'rejected')
          showAlert('rejected-alert');
        else
          $window.location.href = 'inquiry.html?r=' + round_id + '&u=' + $scope.login.email;
      }); 
    }
  }
  
  //hide the alerts
  function hideAlerts() {
    for(alert in alerts)
      $('#' + alerts[alert]).hide();
  }
  
  //show a certain alert and hide the others
  function showAlert(alertId) {
    for(alert in alerts)
      if(alerts[alert] != alertId)
        $('#' + alerts[alert]).hide();
    
    $('#' + alertId).show();
  }
  
  $scope.hideAlert = function(alert) {
    $('#' + alert).hide();
  }
  
  /*** STARTUP FUNCTIONS ***/
  getSubject();
  hideAlerts();
});
