app.controller('InquiryStep3Controller', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;
  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('r=') + 'r='.length, url.indexOf('&u=')));
  //get the user's email address
  $scope.user_id = url.substr(url.indexOf('&u=') + '&u='.length);
});