app.controller('DelphiLoginController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;

  //get the delphi round (execution) id
  var round_id = Number(url.slice(url.indexOf('round=') + 'round='.length));

  //redirect to the delphi survey page
  $scope.startSurvey = function() {
    $window.location.href = 'delphi-survey.html?round=' + round_id + '&user=' + $scope.login.email;
  }

});
