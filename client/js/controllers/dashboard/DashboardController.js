app.controller('DashboardController', ['$scope', '$window', '$http', function($scope, $window, $http) {
  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      $scope.username = res.user;
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  requestLogIn();
}]);
