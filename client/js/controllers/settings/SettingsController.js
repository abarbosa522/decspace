app.controller('SettingsController', function($scope, $window, $http) {
  //types of the input fields of the current and new password
  $scope.inputTypeCurrent = 'password';
  $scope.inputTypeNew = 'password';

  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(res.data.user == undefined)
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.data.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').then(function(response) {
          for(account in response.data) {
            if(response.data[account].email == $scope.username) {
              $scope.name = response.data[account].name;
              break;
            }
          }

          //check if the logged user is unregistered
          if($scope.username.includes('unregistered@decspace.com'))
            $scope.unregistered_user = true;
          else
            $scope.unregistered_user = false;
        });
      }
    });
  }

  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      if(!$scope.username.includes('unregistered@decspace.com')) {
        //mark the user as logged off
        $http.get('/accounts').then(function(response) {
          var previous_proj, new_proj;

          for(account in response.data)
            if(response.data[account].email == $scope.username) {
              //delete the id of the account
              delete response.data[account]['_id'];
              //store the current account
              previous_proj = angular.copy(response.data[account]);

              response.data[account].logged_in = false;

              new_proj = response.data[account];
              break;
            }

          $http.put('/accounts', [previous_proj, new_proj]).then(function() {
            $window.location.href = '../../index.html';
          });
        });
      }
      else
        $window.location.href = '../../index.html';
    });
  }

  $scope.showCurrentPassword = function() {
    if($scope.inputTypeCurrent == 'password') {
      $scope.inputTypeCurrent = 'text';

      //change eye image: open to closed
      angular.element(document.querySelector('#eye-1')).removeClass('glyphicon-eye-open');
      angular.element(document.querySelector('#eye-1')).addClass('glyphicon-eye-close');
    }
    else {
      $scope.inputTypeCurrent = 'password';

      //change eye image: closed to open
      angular.element(document.querySelector('#eye-1')).removeClass('glyphicon-eye-close');
      angular.element(document.querySelector('#eye-1')).addClass('glyphicon-eye-open');
    }
  }

  $scope.showNewPassword = function() {
    if($scope.inputTypeNew == 'password') {
      $scope.inputTypeNew = 'text';

      //change eye image: open to closed
      angular.element(document.querySelector('#eye-2')).removeClass('glyphicon-eye-open');
      angular.element(document.querySelector('#eye-2')).addClass('glyphicon-eye-close');
    }
    else {
      $scope.inputTypeNew = 'password';

      //change eye image: closed to open
      angular.element(document.querySelector('#eye-2')).removeClass('glyphicon-eye-close');
      angular.element(document.querySelector('#eye-2')).addClass('glyphicon-eye-open');
    }
  }

  //get the number of parameters of a scope variable
  function getNumberOfFields(scope_var) {
    var i = 0;

    for(field in scope_var)
      i++;

    return i;
  }

  $scope.passwordReset = function() {
    if(getNumberOfFields($scope.password) < 2 || $scope.password.current == '' || $scope.password.new == '') {
      showAlert('fields-error');
    }
    else {
      $http.get('/accounts').then(function(response) {
        var prev_proj, new_proj;
        var password_reset = false;

        for(account in response.data) {
          if(response.data[account].email == $scope.username && response.data[account].password == $scope.password.current) {
            //delete the id of the account
            delete response.data[account]['_id'];
            //store the current account
            prev_proj = angular.copy(response.data[account]);
            
            //change the password to the new one
            response.data[account].password = $scope.password.new;
            password_reset = true;
            
            new_proj = response.data[account];
            break;
          }
        }

        if(password_reset) {
          //delete the previous document with the list of projects
          $http.put('/accounts/', [prev_proj, new_proj]).then(function() {
            //show success alert
            showAlert('password-success');
          });
        }
        else {
          //show error alert
          showAlert('password-error');
        }
      });
    }
  }
  
  /*** ALERTS FUNCTIONS ***/
  //hide all alerts
  function hideAlerts() {
    $('#password-error').hide();
    $('#password-success').hide();
    $('#fields-error').hide();
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
  
  $scope.createusers = function() {

            $scope.signup.name = $scope.signup.email.substr(0, $scope.signup.email.indexOf('@'));
        $scope.signup.password= Math.random().toString(36).slice(-8);

            $http.post('/accounts', $scope.signup).then(function(response) {
                showAlert('successful-register');
            });

            $http.post('/accountx', $scope.signup).then(function(response) {
                if(response.data == message_template)
                    showAlert('success-alert');
                else
                    showAlert('error-alert');
            });
    }
    
  requestLogIn();
  hideAlerts();
});
