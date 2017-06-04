app.controller('LogInController', function($scope, $window, $http) {
  $scope.inputType = 'password';
  var successfulString = 'Successful Login';
  var unsuccessfulString = 'Invalid Login';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.logIn = function() {
    $http.post('/login', $scope.login).then(function(res) {
      if(res.data != unsuccessfulString) {

        $http.get('/accounts').then(function(response) {
          var id_doc, proj_res;

          for(account in response.data)
            if(response.data[account].email == res.data) {
              //get current date
              var current_date = new Date();
              var last_login = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
              response.data[account].last_login = last_login;
              id_doc = response.data[account]['_id'];
              proj_res = response.data[account];
              delete proj_res['_id'];
              break;
            }

          //delete the previous document with the list of projects
          $http.delete('/accounts/' + id_doc).then(function() {
            //add the new list of projects
            $http.post('/accounts', proj_res).then(function() {
              $window.location.href = '../workspace/projects.html';
            });
          });
        });
      }
      else
        showAlert('login-error');
    });
  }

  $scope.showPassword = function() {
    if($scope.inputType == 'password') {
      $scope.inputType = 'text';

      //change eye image: open to closed
      angular.element(document.querySelector('#eye-image')).removeClass('glyphicon-eye-open');
      angular.element(document.querySelector('#eye-image')).addClass('glyphicon-eye-close');
    }
    else {
      $scope.inputType = 'password';

      //change eye image: closed to open
      angular.element(document.querySelector('#eye-image')).removeClass('glyphicon-eye-close');
      angular.element(document.querySelector('#eye-image')).addClass('glyphicon-eye-open');
    }
  }

  //hide all alerts
  function hideAlerts() {
    $('#login-error').hide();
  }

  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    //show alert
    angular.element(document.querySelector('#' + alert_id)).alert();
    //hide alert
    angular.element(document.querySelector('#' + alert_id)).fadeTo(3000, 500).slideUp(500, function() {
      angular.element(document.querySelector('#' + alert_id)).slideUp(500);
    });
  }

  hideAlerts();
});
