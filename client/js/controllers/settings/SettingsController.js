app.controller('SettingsController', function($scope, $window, $http) {
  //types of the input fields of the current and new password
  $scope.inputTypeCurrent = 'password';
  $scope.inputTypeNew = 'password';

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

          //check if the logged user is unregistered
          if($scope.username.includes('unregistered@decspace.com'))
            $scope.unregistered_user = true;
          else
            $scope.unregistered_user = false;
        });
      }
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
      $http.get('/accounts').then(function(response) {
        var id_doc, account_res;
        var password_reset = false;

        for(account in response.data) {
          if(response.data[account].email == $scope.username && response.data[account].password == $scope.password.current) {
            //store and delete the document id
            id_doc = response.data[account]['_id'];
            delete response.data[account]['_id'];
            //change the password to the new one
            response.data[account].password = $scope.password.new;
            account_res = response.data[account];
            password_reset = true;
            break;
          }
        }

        if(password_reset) {
          //delete the previous document with the list of projects
          $http.delete('/accounts/' + id_doc).then(function() {
            //add the new list of projects
            $http.post('/accounts', account_res).then(function() {
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
