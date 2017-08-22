app.controller('InquiryLoginController', function($scope, $window, $http, InquiryService) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;

  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('r=') + 'r='.length));

  //get subject of inquiry
  function getSubject() {
    $http.get('/inquiry_rounds').then(function(response) {
      for(round in response.data)
        if(response.data[round].id == round_id) {
          $scope.subject = response.data[round].subject;
          $scope.inquiry_owner = response.data[round].username;
        }
    });
  }

  //redirect to the inquiry page
  $scope.startSurvey = function() {
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
          'email' : $scope.login.email
        };
        
        $http.post('/inquiry_new_expert', new_expert).then(function() {
          $http.get('/inquiry_rounds').then(function(response) {
            for(round in response.data)
              if(response.data[round].id == round_id) {
                InquiryService.createAnswerData(response.data[round], $scope.login.email, 'pending');
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
  
  //hide the alerts
  function hideAlerts() {
    angular.element(document.querySelector('#registered-alert')).hide();
    angular.element(document.querySelector('#rejected-alert')).hide();
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
  
  /*** STARTUP FUNCTIONS ***/
  getSubject();
  hideAlerts();
});
