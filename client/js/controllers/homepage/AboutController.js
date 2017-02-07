app.controller('AboutController', ['$scope', '$window', function($scope, $window) {

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

}]);
