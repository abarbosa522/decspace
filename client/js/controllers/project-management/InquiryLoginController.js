app.controller('InquiryLoginController', function($scope, $window, $http, InquiryService) {
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
    $http.get('/inquiry_responses').then(function(response) {
      var answer_exists = false;

      for(answer in response.data)
        if(response.data[answer].user == $scope.login.email && response.data[answer].round_id == round_id)
          answer_exists = true;

      if(!answer_exists) {
        $http.get('/inquiry_rounds').then(function(response) {
          for(round in response.data) {
            if(response.data[round].id == round_id) {
              InquiryService.createAnswerData(response.data[round], $scope.login.email, function() {
                $window.location.href = 'inquiry.html?round=' + round_id + '&user=' + $scope.login.email;
              });
            }
          }
        });
      }
      else
        $window.location.href = 'inquiry.html?round=' + round_id + '&user=' + $scope.login.email;
    });
  }

  getSubject();
});
