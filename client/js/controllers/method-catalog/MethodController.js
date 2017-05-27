app.controller('MethodController', function($scope, $window, $http) {
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
      $window.location.reload();
    });
  }

  $scope.toSignUp = function() {
    $window.location.href = '../homepage/signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = '../homepage/login.html';
  }

  /*** EXPORT FUNCTION ***/
  $scope.exportExampleData = function(method_name) {
    var zip_file_path = '../../../content/method-catalog/examples/' + method_name + '/' + method_name + '.rar';
    var zip_file_name = method_name + '.rar';
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.href = zip_file_path;
    a.download = zip_file_name;
    a.click();
    document.body.removeChild(a);
  }

  /*** SORT METHOD ***/
  $scope.sort_objects = [
    {'name' : 'Object 2'},
    {'name' : 'Object 1'},
    {'name' : 'Object 3'}
  ];

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
