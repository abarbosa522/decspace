app.controller('SettingsController', function($scope, $window, $http) {
  //types of the input fields of the current and new password
  $scope.inputTypeCurrent = 'password';
  $scope.inputTypeNew = 'password';

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

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  $scope.showCurrentPassword = function() {
    if($scope.inputTypeCurrent == 'password') {
      $scope.inputTypeCurrent = 'text';

      //change eye image: open to closed
      angular.element(document.querySelector('#eye-1')).removeClass('glyphicon-eye-open');
      angular.element(document.querySelector('#eye-1')).addClass('glyphicon-eye-close');
    }
    else {
      $scope.inputTypeCurrent = 'password';

      //change eye image: closed to open
      angular.element(document.querySelector('#eye-1')).removeClass('glyphicon-eye-close');
      angular.element(document.querySelector('#eye-1')).addClass('glyphicon-eye-open');
    }
  }

  $scope.showNewPassword = function() {
    if($scope.inputTypeNew == 'password') {
      $scope.inputTypeNew = 'text';

      //change eye image: open to closed
      angular.element(document.querySelector('#eye-2')).removeClass('glyphicon-eye-open');
      angular.element(document.querySelector('#eye-2')).addClass('glyphicon-eye-close');
    }
    else {
      $scope.inputTypeNew = 'password';

      //change eye image: closed to open
      angular.element(document.querySelector('#eye-2')).removeClass('glyphicon-eye-close');
      angular.element(document.querySelector('#eye-2')).addClass('glyphicon-eye-open');
    }
  }

  //get the number of parameters of a scope variable
  function getNumberOfFields(scope_var) {
    var i = 0;

    for(field in scope_var)
      i++;

    return i;
  }

  $scope.passwordReset = function() {
    if(getNumberOfFields($scope.password) < 2 || $scope.password.current == '' || $scope.password.new == '') {
      $scope.showPasswordError = false;
      $scope.showPasswordSuccess = false;
      $scope.showFieldsError = true;
    }
    else {
      $http.get('/accounts').success(function(response) {
        var id_doc, account_res;
        var password_reset = false;

        for(account in response) {
          if(response[account]['email'] == $scope.username && response[account]['password'] == $scope.password.current) {
            //store and delete the document id
            id_doc = response[account]['_id'];
            delete response[account]['_id'];
            //change the password to the new one
            response[account]['password'] = $scope.password.new;
            account_res = response[account];
            password_reset = true;
            break;
          }
        }

        if(password_reset) {
          //delete the previous document with the list of projects
          $http.delete('/accounts/' + id_doc).success(function() {
            //add the new list of projects
            $http.post('/accounts', account_res).success(function() {
              //show success alert
              $scope.showPasswordError = false;
              $scope.showPasswordSuccess = true;
              $scope.showFieldsError = false;
            });
          });
        }
        else {
          //show error alert
          $scope.showPasswordError = true;
          $scope.showPasswordSuccess = false;
          $scope.showFieldsError = false;
        }
      });
    }
  }

  requestLogIn();
});
