app.controller('IndexController', function($scope, $window, $http) {

  $scope.toSignUp = function() {
    $window.location.href = 'content/homepage/signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'content/homepage/login.html';
  }

  $scope.unregisteredLogIn = function() {
    $http.post('/unregisteredLogIn').then(function(res) {
      $window.location.href = 'content/dashboard/dashboard.html';
    });
  }

});
