app.controller('MethodCatalogController', function($scope, $window, $http, MethodsService) {
  /*** LOGIN FUNCTIONS ***/

  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(res.data.user == undefined || res.data.user == 'johndoe@decspace.com')
        $scope.loggedIn = false;
      else {
        $scope.loggedIn = true;
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

  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  $scope.toSignUp = function() {
    $window.location.href = '../homepage/signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = '../homepage/login.html';
  }

  /*** METHODS ***/

  //list of methods currently available
  $scope.methods = MethodsService.getMethods();

  //redirect to the method page
  $scope.toMethod = function(method) {
    $window.location.href = method.toLowerCase() + '.html';
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
