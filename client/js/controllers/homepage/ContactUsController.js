app.controller('ContactUsController', function($scope, $http, $window) {
  var message_template = 'Message sent!';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.sendEmail = function() {
    $http.post('/contactus', $scope.contact).then(function(response) {
      if(response.data == message_template) {
        $scope.showSuccessAlert = true;
        $scope.showErrorAlert = false;
      }
      else {
        $scope.showSuccessAlert = false;
        $scope.showErrorAlert = true;
      }
    });
  }

  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(typeof res.data.user == 'undefined')
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

  requestLogIn();
});
