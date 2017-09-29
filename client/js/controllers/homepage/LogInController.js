app.controller('LogInController', function($scope, $window, $http) {
  $scope.inputType = 'password';
  var successfulString = 'Successful Login';
  var unsuccessfulString = 'Invalid Login';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.logIn = function() {
    $http.post('/login', $scope.login).then(function(res) {
      if(res.data != unsuccessfulString) {

        $http.get('/accounts').then(function(response) {
          var previous_proj, new_proj;

          for(account in response.data)
            if(response.data[account].email == res.data) {
              //delete the id of the account
              delete response.data[account]['_id'];
              //store the current account
              previous_proj = angular.copy(response.data[account]);
              
              //get current date
              var current_date = new Date();
              var last_login = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
              response.data[account].last_login = last_login;

              response.data[account].logged_in = true;
              
              new_proj = response.data[account];
              break;
            }

          $http.put('/accounts/', [previous_proj, new_proj]).then(function() {
            $window.location.href = '../projects/projects.html';
          });
        });
      }
      else
        showAlert('login-error');
    });
  }

  $scope.showPassword = function() {
    if($scope.inputType == 'password') {
      $scope.inputType = 'text';

      //change eye image: open to closed
      angular.element(document.querySelector('#eye-image')).removeClass('glyphicon-eye-open');
      angular.element(document.querySelector('#eye-image')).addClass('glyphicon-eye-close');
    }
    else {
      $scope.inputType = 'password';

      //change eye image: closed to open
      angular.element(document.querySelector('#eye-image')).removeClass('glyphicon-eye-close');
      angular.element(document.querySelector('#eye-image')).addClass('glyphicon-eye-open');
    }
  }

  /*** ALERTS FUNCTIONS ***/
  //hide all alerts
  function hideAlerts() {
    $('#login-error').hide();
  }
  
  //hide a specific alert
  $scope.hideAlert = function(alert) {
    $('#' + alert).hide();
  }
  
  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    hideAlerts();
    $('#' + alert_id).show();
  }

  hideAlerts();
});
