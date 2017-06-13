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

          //check if the logged user is unregistered
          if($scope.username.includes('unregistered@decspace.com'))
            $scope.unregistered_user = true;
          else
            $scope.unregistered_user = false;
        });
      }
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      if(!$scope.username.includes('unregistered@decspace.com')) {
        //mark the user as logged off
        $http.get('/accounts').then(function(response) {
          var id_doc, proj_res;

          for(account in response.data)
            if(response.data[account].email == $scope.username) {
              response.data[account].logged_in = false;

              id_doc = response.data[account]['_id'];
              proj_res = response.data[account];
              delete proj_res['_id'];
              break;
            }

          //delete the previous document with the list of projects
          $http.delete('/accounts/' + id_doc).then(function() {
            //add the new list of projects
            $http.post('/accounts', proj_res).then(function() {
              $window.location.reload();
            });
          });
        });
      }
      else
        $window.location.reload();
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
