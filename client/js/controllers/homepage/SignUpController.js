app.controller('SignUpController', function($scope, $window, $http) {

  $scope.inputType = 'password';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.signUp = function() {
    if(typeof $scope.signup.email != 'undefined') {
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

          //create new account
          $http.post('/accounts', $scope.signup).then(function(response) {
            $scope.showSuccessAlert = true;
          });
        }
      });
    }
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
});
