app.controller('LogInController', ['$scope', '$window', '$http', function($scope, $window, $http) {
  $scope.inputType = 'password';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.logIn = function() {
    $http.get('/accounts').success(function(response) {
      var correct_log_in = false;

      for(account in response) {
        if(response[account]['email'] == $scope.login.email && response[account]['password'] == $scope.login.password) {
          correct_log_in = true;
          break;
        }
      }

      if(correct_log_in) {
        $window.location.href = '../dashboard/dashboard.html';
        $scope.showErrorAlert = false;
      }
      else {
        $scope.showErrorAlert = true;
      }
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
}]);
