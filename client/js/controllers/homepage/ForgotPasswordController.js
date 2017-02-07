app.controller('ForgotPasswordController', ['$scope', '$window', '$http', function($scope, $window, $http) {
  var message_template = 'Message sent!';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.recoverPassword = function() {
    $http.get('/accounts').success(function(response) {
      var valid_email = false;

      for(account in response) {
        if(response[account]['email'] == $scope.forgot.email) {
          valid_email = true;
          $scope.forgot.password = response[account]['password'];
          break;
        }
      }

      if(valid_email) {
        $http.post('/password', $scope.forgot).success(function(response) {
          if(response == message_template) {
            $scope.showSuccessAlert = true;
            $scope.showErrorEmailAlert = false;
            $scope.showErrorMessageAlert = false;
          }
          else {
            $scope.showSuccessAlert = false;
            $scope.showErrorEmailAlert = false;
            $scope.showErrorMessageAlert = true;
          }
        });
      }
      else {
        $scope.showSuccessAlert = false;
        $scope.showErrorEmailAlert = true;
        $scope.showErrorMessageAlert = false;
      }
    });
  }
}]);
