app.controller('ContactUsController', ['$scope', '$http', '$window', function($scope, $http, $window) {
  var message_template = 'Message sent!';

  $scope.toSignUp = function() {
    $window.location.href = 'signup.html';
  }

  $scope.toLogIn = function() {
    $window.location.href = 'login.html';
  }

  $scope.sendEmail = function() {
    $http.post('/contactus', $scope.contact).success(function(response) {
      if(response == message_template) {
        $scope.showSuccessAlert = true;
        $scope.showErrorAlert = false;
      }
      else {
        $scope.showSuccessAlert = false;
        $scope.showErrorAlert = true;
      }
    });
  }

}]);
