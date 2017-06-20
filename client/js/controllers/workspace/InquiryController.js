app.controller('InquiryController', function($scope) {

  /*** DATA INPUT FUNCTIONS ***/

  $scope.blurInquirySubject = function() {
    if($scope.currentModule.input.subject == undefined || $scope.currentModule.input.subject == '')
      $('#inquiry-subject').addClass('has-error');
    else
      $('#inquiry-subject').removeClass('has-error');
  }

  $scope.addInquiryEmail = function() {
    //if there is an input field not assigned
    if($scope.new_inquiry_email.address == undefined || $scope.new_inquiry_email.address == '')
      $('#new-inquiry-email').addClass('has-error');
    else {
      //assign an unique id to the new email
      if($scope.currentModule.input.emails.length == 0)
        $scope.new_inquiry_email.id = 1;
      else
        $scope.new_inquiry_email.id = $scope.currentModule.input.emails[$scope.currentModule.input.emails.length - 1]['id'] + 1;

      $scope.currentModule.input.emails.push(angular.copy($scope.new_inquiry_email));

      $scope.new_inquiry_email.address = '';

      //remove all error classes - just be sure
      $('#new-inquiry-email').removeClass('has-error');
    }
  }

  $scope.blurInquiryEmail = function(email) {
    if(email.address == undefined || email.address == '')
      $('#inquiry-email-' + email.id).addClass('has-error');
    else
      $('#inquiry-email-' + email.id).removeClass('has-error');
  }

  $scope.addInquiryQuestion = function() {
    var can_add_question = true;

    //if a title was not assigned to the new question
    if($scope.new_inquiry_question.title == undefined || $scope.new_inquiry_question.title == '') {
      $('#new-inquiry-question-title').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-inquiry-question-title').removeClass('has-error');

    //if a description was not assigned to the new question
    if($scope.new_inquiry_question.description == undefined || $scope.new_inquiry_question.description == '') {
      $('#new-inquiry-question-description').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-inquiry-question-description').removeClass('has-error');

    if(can_add_question) {
      //assign an unique id to the new email
      if($scope.currentModule.input.questions.length == 0)
        $scope.new_inquiry_question.id = 1;
      else
        $scope.new_inquiry_question.id = $scope.currentModule.input.questions[$scope.currentModule.input.questions.length - 1]['id'] + 1;

      $scope.currentModule.input.questions.push(angular.copy($scope.new_inquiry_question));

      $scope.new_inquiry_question.title = '';
      $scope.new_inquiry_question.description = '';

      //remove all error classes - just be sure
      $('#new-inquiry-question-title').removeClass('has-error');
      $('#new-inquiry-question-description').removeClass('has-error');
    }
  }

  $scope.blurInquiryQuestionTitle = function(question) {
    if(question.title == undefined || question.title == '')
      $('#inquiry-question-title-' + question.id).addClass('has-error');
    else
      $('#inquiry-question-title-' + question.id).removeClass('has-error');
  }

  $scope.blurInquiryQuestionDescription = function(question) {
    if(question.description == undefined || question.description == '')
      $('#inquiry-question-description-' + question.id).addClass('has-error');
    else
      $('#inquiry-question-description-' + question.id).removeClass('has-error');
  }

  $scope.blurInquirySuggestionsToggle = function() {
    if($scope.currentModule.input['suggestions toggle'] == undefined || $scope.currentModule.input['suggestions toggle'] == '')
      $('#inquiry-suggestions-toggle').addClass('has-error');
    else
      $('#inquiry-suggestions-toggle').removeClass('has-error');
  }

  $scope.addInquiryOpenAnswerQuestion = function() {
    //if a title was not assigned to the new question
    if($scope.new_inquiry_open_answer_question.question == undefined || $scope.new_inquiry_open_answer_question.question == '')
      $('#new-inquiry-open-answer-question').addClass('has-error');
    else {
      //assign an unique id to the new email
      if($scope.currentModule.input.open_answer_questions.length == 0)
        $scope.new_inquiry_open_answer_question.id = 1;
      else
        $scope.new_inquiry_open_answer_question.id = $scope.currentModule.input.open_answer_questions[$scope.currentModule.input.open_answer_questions.length - 1].id + 1;

      $scope.currentModule.input.open_answer_questions.push(angular.copy($scope.new_inquiry_open_answer_question));

      $scope.new_inquiry_open_answer_question.question = '';

      //remove all error classes - just be sure
      $('#new-inquiry-open-answer-question').removeClass('has-error');
    }
  }

  $scope.blurInquiryOpenAnswerQuestion = function(open_answer_question) {
    if(open_answer_question.question == undefined || open_answer_question.question == '')
      $('#inquiry-open-answer-question-' + open_answer_question.id).addClass('has-error');
    else
      $('#inquiry-open-answer-question-' + open_answer_question.id).removeClass('has-error');
  }
});
