app.controller('InquiryOutputController', function($scope, InquiryService) {

  $scope.stopInquiry = function() {
    $scope.currentModule.log.status = 'ended';

    $scope.saveData();
  }
  
  $scope.approveRequest = function(user) {
    $http.get('/inquiry_responses').then(function(response) {
      var previous_res, new_res;
      
      for(res in response.data)
        if(response.data[res].user == user.email && response.data[res].round_id == $scope.currentModule.input.round_id) {
          delete response.data[res]['_id'];
          previous_res = angular.copy(response.data[res]);
          
          response.data[res].status = 'approved';
          
          new_res = response.data[res];
          break;
        }
      
      $http.put('/inquiry_responses', [previous_res, new_res]).then(function() {
        $scope.currentModule.log.pending_users.splice($scope.currentModule.log.pending_users.indexOf(user), 1);
        
        //send survey link
        var send_email = {
          'email' : user.email,
          'link' : 'http://decspace.sysresearch.org/content/project-management/inquiry.html?r=' + new_res.round_id + '&u=' + user.email
        };
        
        if(!$scope.currentModule.input.personalized_email)
          $http.post('/default_inquiry_survey', send_email).then(function(response) {});
        else {
          send_email.subject = $scope.currentModule.input.email.subject;
          send_email.text = $scope.currentModule.input.email.text;

          $http.post('/personalized_inquiry_survey', send_email).then(function(response) {});
        }
      });
    });
  }
  
  $scope.rejectRequest = function(user) {
    $http.get('/inquiry_responses').then(function(response) {
      var previous_res, new_res;
      
      for(res in response.data)
        if(response.data[res].user == user.email && response.data[res].round_id == $scope.currentModule.input.round_id) {
          delete response.data[res]['_id'];
          previous_res = angular.copy(response.data[res]);
          
          response.data[res].status = 'rejected';
          
          new_res = response.data[res];
          break;
        }
      
      $http.put('/inquiry_responses', [previous_res, new_res]).then(function() {
        $scope.currentModule.log.pending_users.splice($scope.currentModule.log.pending_users.indexOf(user), 1);
      });
    });
  }
  
  $scope.checkTypeAnswer = function(answer) {
    if(typeof answer == 'object')
      return true;
    else
      return false;
  }
  
  $scope.addInquiryOutputEmail = function() {
    //if there is an input field not assigned
    if($scope.new_inquiry_output_email.address == undefined || $scope.new_inquiry_output_email.address == '')
      $('#new-inquiry-output-email').addClass('has-error');
    else {      
      //assign an unique id to the new email
      if($scope.currentModule.input.emails.length == 0)
        $scope.new_inquiry_output_email.id = 1;
      else
        $scope.new_inquiry_output_email.id = $scope.currentModule.input.emails[$scope.currentModule.input.emails.length - 1]['id'] + 1;

      $scope.currentModule.input.emails.push(angular.copy($scope.new_inquiry_output_email));

      //send link
      InquiryService.sendSurveyLink($scope.currentModule.input, $scope.new_inquiry_output_email.address);
      
      $scope.new_inquiry_output_email.address = '';
      
      //remove all error classes - just be sure
      $('#new-inquiry-output-email').removeClass('has-error');
    }
  }
}); 