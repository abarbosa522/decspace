app.controller('ContactUsController', function($scope, $http, $window) {
  var message_template = 'Message sent!';

  $scope.contact = {};

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.sendEmail = function() {
    var can_send_email = true;

    if($scope.contact.name == undefined || $scope.contact.name == '') {
      $('#input-name').addClass('has-error');
      can_send_email = false;
    }
    else
      $('#input-name').removeClass('has-error');

    if($scope.contact.email == undefined || $scope.contact.email == '') {
      $('#input-email').addClass('has-error');
      can_send_email = false;
    }
    else
      $('#input-email').removeClass('has-error');

    if($scope.contact.message == undefined || $scope.contact.message == '') {
      $('#input-message').addClass('has-error');
      can_send_email = false;
    }
    else
      $('#input-message').removeClass('has-error');

    if(can_send_email) {
      $http.post('/contactus', $scope.contact).then(function(response) {
        if(response.data == message_template)
          showAlert('success-alert');
        else
          showAlert('error-alert');
      });
    }
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

  $scope.blurContactName = function() {
    if($scope.contact.name == undefined || $scope.contact.name == '')
      $('#input-name').addClass('has-error');
    else
      $('#input-name').removeClass('has-error');
  }

  $scope.blurContactEmail = function() {
    if($scope.contact.email == undefined || $scope.contact.email == '')
      $('#input-email').addClass('has-error');
    else
      $('#input-email').removeClass('has-error');
  }

  $scope.blurContactMessage = function() {
    if($scope.contact.message == undefined || $scope.contact.message == '')
      $('#input-message').addClass('has-error');
    else
      $('#input-message').removeClass('has-error');
  }

  //hide all alerts
  function hideAlerts() {
    $('#success-alert').hide();
    $('#error-alert').hide();
  }

  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    //show alert
    angular.element(document.querySelector('#' + alert_id)).alert();
    //hide alert
    angular.element(document.querySelector('#' + alert_id)).fadeTo(3000, 500).slideUp(500, function(){
      angular.element(document.querySelector('#' + alert_id)).slideUp(500);
    });
  }

  requestLogIn();
  hideAlerts();
});
