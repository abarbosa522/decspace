app.controller('SignUpController', function($scope, $window, $http) {

  $scope.inputType = 'password';

  //initialize the signup object
  $scope.signup = {};

  //account privacy is public by default
  $scope.signup.privacy = 'public';

  //redirect to the Sign Up page
  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  //redirect to the Log In page
  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  //register new account
  $scope.signUp = function() {
    var can_register = true;

    //if a name was not assigned
    if($scope.signup.name == undefined || $scope.signup.name == '') {
      $('#input-name').addClass('has-error');
      can_register = false;
    }
    else
      $('#input-name').removeClass('has-error');

    //if an email was not assigned
    if($scope.signup.email == undefined || $scope.signup.email == '') {
      $('#input-email').addClass('has-error');
      can_register = false;
    }
    else
      $('#input-email').removeClass('has-error');

    //if a password was not assigned
    if($scope.signup.password == undefined || $scope.signup.password == '') {
      $('#input-password').addClass('has-error');
      can_register = false;
    }
    else
      $('#input-password').removeClass('has-error');

    if(can_register) {
      $('#input-name').removeClass('has-error');
      $('#input-email').removeClass('has-error');
      $('#input-password').removeClass('has-error');

      $http.get('/accounts').then(function(response) {
        //check if input email already exists
        var email_exists = false;

        for(account in response.data) {
          if(response.data[account]['email'] == $scope.signup.email) {
            email_exists = true;
            break;
          }
        }

        if(email_exists) {
          //add error class to input field
          angular.element(document.querySelector('#input-email-div')).addClass('has-error has-feedback');
          $scope.showErrorHelp = true;
        }
        else {
          //remove error classes - just in case an existing email has been inserted
          angular.element(document.querySelector('#input-email-div')).removeClass('has-error has-feedback');
          $scope.showErrorHelp = false;

          //get current date
          var current_date = new Date();
          $scope.signup.sign_up_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

          $scope.signup.logged_in = false;
          
          //create new account
          $http.post('/accounts', $scope.signup).then(function(response) {
            showAlert('successful-register');
          });
        }
      });
    }
  }

  //show or hide input password
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
    $('#successful-register').hide();
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
