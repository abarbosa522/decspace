app.controller('IndexController', function($scope, $window, $http) {

  $scope.toSignUp = function() {
    $window.location.href = 'content/homepage/signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'content/homepage/login.html';
  }

  $scope.unregisteredLogIn = function() {
    $http.post('/unregisteredLogIn').then(function(res) {
      $window.location.href = 'content/projects/projects.html';
    });
  }
  
  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      if(!$scope.username.includes('unregistered@decspace.com')) {
        //mark the user as logged off
        $http.get('/accounts').then(function(response) {
          var previous_proj, new_proj;

          for(account in response.data)
            if(response.data[account].email == $scope.username) {
              //delete the id of the account
              delete response.data[account]['_id'];
              //store the current account
              previous_proj = angular.copy(response.data[account]);

              response.data[account].logged_in = false;

              new_proj = response.data[account];
              break;
            }

          $http.put('/accounts', [previous_proj, new_proj]).then(function() {
            $window.location.href = '../../index.html';
          });
        });
      }
      else
        $window.location.href = '../../index.html';
    });
  }
  
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
  
  requestLogIn();
});
