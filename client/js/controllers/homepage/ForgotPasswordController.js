app.controller('ForgotPasswordController', function($scope, $window, $http) {
  var message_template = 'Message sent!';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.recoverPassword = function() {
    $http.get('/accounts').then(function(response) {
      var valid_email = false;

      for(account in response.data) {
        if(response.data[account].email == $scope.forgot.email) {
          valid_email = true;
          $scope.forgot.password = response.data[account].password;
          break;
        }
      }

      if(valid_email) {
        $http.post('/password', $scope.forgot).then(function(response) {
          if(response.data == message_template)
            showAlert('successful-forgot');
          else
            showAlert('error-forgot');
        });
      }
      else
        showAlert('wrong-email');
    });
  }

  //hide all alerts
  function hideAlerts() {
    $('#successful-forgot').hide();
    $('#wrong-email').hide();
    $('#error-forgot').hide();
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

  hideAlerts();
});
