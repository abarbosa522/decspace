app.controller('DashboardController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //check if there is a user logged in
  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      if(typeof res.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').success(function(response) {
          for(account in response) {
            if(response[account].email == $scope.username) {
              $scope.name = response[account].name;
              break;
            }
          }
        });
      }
    });
  }

  //user log out
  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  /*** REDIRECTING FUNCTIONS ***/

  //redirect to the Project Management page
  $scope.toProjectManagement = function() {
    $window.location.href = '../project-management/project-management.html';
  }

  //redirect to the Workspace Projects page
  $scope.toWorkspaceProjects = function() {
    $window.location.href = '../workspace/projects.html';
  }

  //redirect to the Settings page
  $scope.toSettings = function() {
    $window.location.href = '../settings/settings.html';
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
