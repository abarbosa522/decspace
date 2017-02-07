app.controller('IndexController', ['$scope', '$window', function($scope, $window) {

  $scope.toSignUp = function() {
    $window.location.href = 'content/homepage/signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'content/homepage/login.html';
  }

}]);
