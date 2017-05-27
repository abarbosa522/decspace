app.controller('DashboardController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  $scope.unregisteredUser = false;

  //check if there is a user logged in
  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(res.data.user == undefined)
        $window.location.href = '../homepage/login.html';
      else {
        if(res.data.user == 'johndoe@decspace.com')
          $scope.unregisteredUser = true;
          
        $scope.username = res.data.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').then(function(response) {
          for(account in response.data) {
            if(response.data[account].email == $scope.username) {
              $scope.name = response.data[account].name;
              break;
            }
          }
        });
      }
    });
  }

  //user log out
  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
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

  //redirect to the Method Catalog page
  $scope.toMethodCatalog = function() {
    $window.location.href = '../method-catalog/method-catalog.html';
  }

  //redirect to the Settings page
  $scope.toSettings = function() {
    $window.location.href = '../settings/settings.html';
  }

  //redirect to the Administrator page
  $scope.toAdministratorRights = function() {
    $window.location.href = '../administrator/administrator.html';
  }

  //redirect to the Sign Up page
  $scope.toSignUp = function() {
    $window.location.href = '../homepage/signup.html';
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
