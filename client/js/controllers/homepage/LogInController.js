app.controller('LogInController', ['$scope', '$window', '$http', function($scope, $window, $http) {
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
    $http.post('/login', $scope.login).success(function(res) {

      if(res == successfulString) {
        $scope.showErrorAlert = false;
        $window.location.href = '../dashboard/dashboard.html';
      }
      else if(res == unsuccessfulString) {
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
