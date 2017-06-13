app.controller('InquiryLoginController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //get the current url
  var url = window.location.href;

  //get the inquiry round (execution) id
  var round_id = Number(url.slice(url.indexOf('round=') + 'round='.length));

  //get subject of inquiry
  function getSubject() {
    $http.get('/inquiry_rounds').then(function(response) {
      for(round in response.data)
        if(response.data[round].id == round_id)
          $scope.subject = response.data[round].subject;
    });
  }

  //redirect to the inquiry page
  $scope.startSurvey = function() {
    $window.location.href = 'inquiry.html?round=' + round_id + '&user=' + $scope.login.email;
  }

  getSubject();
});
