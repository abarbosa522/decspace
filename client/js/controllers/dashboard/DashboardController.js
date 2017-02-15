app.controller('DashboardController', function($scope, $window, $http) {
  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      if(typeof res.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else
        $scope.username = res.user;
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  $scope.toProjectManagement = function() {
    $window.location.href = '../project-management/project-management.html';
  }

  requestLogIn();
});
