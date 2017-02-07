app.controller('SignUpController', ['$scope', '$window', '$http', function($scope, $window, $http) {

  $scope.inputType = 'password';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.signUp = function() {
    $http.get('/accounts').success(function(response) {
      //check if input email already exists
      var email_exists = false;

      for(account in response) {
        if(response[account]['email'] == $scope.signup.email) {
          email_exists = true;
          break;
        }
      }

      if(email_exists) {
        //add error class to input field
        angular.element(document.querySelector('#input-email-div')).addClass('has-error has-feedback');
      }
      else {
        //remove error classes - just in case an existing email has been inserted
        angular.element(document.querySelector('#input-email-div')).removeClass('has-error has-feedback');

        //create new account
        $http.post('/accounts', $scope.signup).success(function(response) {
          $scope.showSuccessAlert = true;
        });
      }
    });
  }

  $scope.showPassword = function() {
    if($scope.inputType == 'password')
      $scope.inputType = 'text';
    else
      $scope.inputType = 'password';
  }

}]);
