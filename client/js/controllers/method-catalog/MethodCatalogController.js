app.controller('MethodCatalogController', function($scope, $window, $http) {
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

  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  /*** METHODS ***/

  //list of methods currently available
  $scope.methods = ['CAT-SD', 'Delphi', 'OrderBy', 'Sort', 'SRF'];

  //redirect to the method page
  $scope.toMethod = function(method) {
    $window.location.href = method + '.html';
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
