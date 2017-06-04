app.controller('DelphiController', function($scope) {

  /*** DATA INPUT FUNCTIONS ***/

  $scope.blurDelphiSubject = function() {
    if($scope.currentModule.input.subject == undefined || $scope.currentModule.input.subject == '')
      $('#delphi-subject').addClass('has-error');
    else
      $('#delphi-subject').removeClass('has-error');
  }

  $scope.addDelphiEmail = function() {
    //if there is an input field not assigned
    if($scope.new_delphi_email.address == undefined || $scope.new_delphi_email.address == '')
      $('#new-delphi-email').addClass('has-error');
    else {
      //assign an unique id to the new email
      if($scope.currentModule.input.emails.length == 0)
        $scope.new_delphi_email.id = 1;
      else
        $scope.new_delphi_email.id = $scope.currentModule.input.emails[$scope.currentModule.input.emails.length - 1]['id'] + 1;

      $scope.currentModule.input.emails.push(angular.copy($scope.new_delphi_email));

      $scope.new_delphi_email.address = '';

      //remove all error classes - just be sure
      $('#new-delphi-email').removeClass('has-error');
    }
  }

  $scope.blurDelphiEmail = function(email) {
    if(email.address == undefined || email.address == '')
      $('#delphi-email-' + email.id).addClass('has-error');
    else
      $('#delphi-email-' + email.id).removeClass('has-error');
  }

  $scope.addDelphiQuestion = function() {
    var can_add_question = true;

    //if a title was not assigned to the new question
    if($scope.new_delphi_question.title == undefined || $scope.new_delphi_question.title == '') {
      $('#new-delphi-question-title').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-delphi-question-title').removeClass('has-error');

    //if a description was not assigned to the new question
    if($scope.new_delphi_question.description == undefined || $scope.new_delphi_question.description == '') {
      $('#new-delphi-question-description').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-delphi-question-description').removeClass('has-error');

    if(can_add_question) {
      //assign an unique id to the new email
      if($scope.currentModule.input.questions.length == 0)
        $scope.new_delphi_question.id = 1;
      else
        $scope.new_delphi_question.id = $scope.currentModule.input.questions[$scope.currentModule.input.questions.length - 1]['id'] + 1;

      $scope.currentModule.input.questions.push(angular.copy($scope.new_delphi_question));

      $scope.new_delphi_question.title = '';
      $scope.new_delphi_question.description = '';

      //remove all error classes - just be sure
      $('#new-delphi-question-title').removeClass('has-error');
      $('#new-delphi-question-description').removeClass('has-error');
    }
  }

  $scope.blurDelphiQuestionTitle = function(question) {
    if(question.title == undefined || question.title == '')
      $('#delphi-question-title-' + question.id).addClass('has-error');
    else
      $('#delphi-question-title-' + question.id).removeClass('has-error');
  }

  $scope.blurDelphiQuestionDescription = function(question) {
    if(question.description == undefined || question.description == '')
      $('#delphi-question-description-' + question.id).addClass('has-error');
    else
      $('#delphi-question-description-' + question.id).removeClass('has-error');
  }
});
