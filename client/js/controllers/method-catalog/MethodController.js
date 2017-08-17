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

  /*** EXPORT FUNCTION ***/
  $scope.exportExampleData = function(method_name) {
    var zip_file_path = '../../../content/method-catalog/examples/' + method_name + '/' + method_name + '.zip';
    var zip_file_name = method_name + '.zip';
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.href = zip_file_path;
    a.download = zip_file_name;
    a.click();
    document.body.removeChild(a);
  }

  /*** SORT METHOD ***/
  $scope.sort_objects = [
    {'name' : 'Music'},
    {'name' : 'Photography'},
    {'name' : 'Movies'},
    {'name' : 'Drawing'}
  ];

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
