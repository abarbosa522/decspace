app.controller('MethodController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //check if there is a user logged in
  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(res.data.user == undefined)
        $window.location.href = '../homepage/login.html';
      else {
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

  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      $window.location.href = '../../index.html';
    });
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
