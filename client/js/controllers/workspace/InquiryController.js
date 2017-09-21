app.controller('InquiryController', function($scope) {
  /*** DATA INPUT FUNCTIONS ***/
  
  /*** SUBJECT ***/
  
  $scope.blurInquirySubject = function() {
    if($scope.currentModule.input.subject == undefined || $scope.currentModule.input.subject == '')
      $('#inquiry-subject').addClass('has-error');
    else
      $('#inquiry-subject').removeClass('has-error');
  }
  
  /*** EMAILS ***/
  
  $scope.addInquiryEmail = function() {
    var can_add = true;
    //if there is an input field not assigned
    if($scope.new_inquiry_email.address == undefined || $scope.new_inquiry_email.address == '') {
      $('#new-inquiry-email').addClass('has-error');
      can_add = false;
    }
    else
      $('#new-inquiry-email').removeClass('has-error');
    
    if($scope.new_inquiry_email.ask_characterization_questions == undefined || $scope.new_inquiry_email.ask_characterization_questions == '') {
      $('#new-inquiry-ask').addClass('has-error');
      can_add = false;
    }
    else
      $('#new-inquiry-ask').removeClass('has-error');
    
    if(can_add) {
      //assign an unique id to the new email
      if($scope.currentModule.input.emails.length == 0)
        $scope.new_inquiry_email.id = 1;
      else
        $scope.new_inquiry_email.id = $scope.currentModule.input.emails[$scope.currentModule.input.emails.length - 1]['id'] + 1;

      $scope.currentModule.input.emails.push(angular.copy($scope.new_inquiry_email));

      $scope.new_inquiry_email.address = '';
      $scope.new_inquiry_email.ask_characterization_questions = '';
      
      //remove all error classes - just be sure
      $('#new-inquiry-email').removeClass('has-error');
      $('#new-inquiry-ask').removeClass('has-error');
    }
  }

  $scope.blurInquiryEmail = function(email) {
    if(email.address == undefined || email.address == '')
      $('#inquiry-email-' + email.id).addClass('has-error');
    else
      $('#inquiry-email-' + email.id).removeClass('has-error');
  }
  
  //copy an email
  $scope.copyInquiryEmail = function(email) {
    //make a copy of the selected email
    var new_email = angular.copy(email);
    //give it a new id
    new_email.id = $scope.currentModule.input.emails[$scope.currentModule.input.emails.length - 1].id + 1;
    //insert the new email into the emails array
    $scope.currentModule.input.emails.push(new_email);
  }
  
  /*** CHARACTERIZATION QUESTIONS ***/
  
  $scope.addInquiryOpenAnswerQuestion = function() {
    var can_add_question = true;

    //if a title was not assigned to the new question
    if($scope.new_inquiry_open_answer_question.question == undefined || $scope.new_inquiry_open_answer_question.question == '') {
      $('#new-inquiry-open-answer-question').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-inquiry-open-answer-question').removeClass('has-error');

    if($scope.new_inquiry_open_answer_question.type == undefined || $scope.new_inquiry_open_answer_question.type == '') {
      $('#new-inquiry-open-answer-type').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-inquiry-open-answer-type').removeClass('has-error');

    if(can_add_question) {
      //assign an unique id to the new email
      if($scope.currentModule.input.open_answer_questions.length == 0)
        $scope.new_inquiry_open_answer_question.id = 1;
      else
        $scope.new_inquiry_open_answer_question.id = $scope.currentModule.input.open_answer_questions[$scope.currentModule.input.open_answer_questions.length - 1].id + 1;

      if($scope.new_inquiry_open_answer_question.type == 'Multiple Choice')
        $scope.new_inquiry_open_answer_question.choices = [];

      $scope.currentModule.input.open_answer_questions.push(angular.copy($scope.new_inquiry_open_answer_question));

      $scope.new_inquiry_open_answer_question.question = '';
      $scope.new_inquiry_open_answer_question.type = '';

      //remove all error classes - just be sure
      $('#new-inquiry-open-answer-question').removeClass('has-error');
      $('#new-inquiry-open-answer-type').removeClass('has-error');
    }
  }

  $scope.blurInquiryOpenAnswerQuestion = function(open_answer_question) {
    if(open_answer_question.question == undefined || open_answer_question.question == '')
      $('#inquiry-open-answer-question-' + open_answer_question.id).addClass('has-error');
    else
      $('#inquiry-open-answer-question-' + open_answer_question.id).removeClass('has-error');
  }
  
  //copy a characterization question
  $scope.copyInquiryCharacterizationQuestion = function(question) {
    //make a copy of the selected characterization question
    var new_question = angular.copy(question);
    //give it a new id
    new_question.id = $scope.currentModule.input.open_answer_questions[$scope.currentModule.input.open_answer_questions.length - 1].id + 1;
    //insert the new question into the questions array
    $scope.currentModule.input.open_answer_questions.push(new_question);
  }
  
  /*** CHOICES ***/
  
  $scope.addInquiryChoice = function(open_answer_question) {
    //if a title was not assigned to the new question
    if($scope.new_inquiry_choice[open_answer_question.id].text == undefined || $scope.new_inquiry_choice[open_answer_question.id].text == '')
      $('#new-inquiry-choice').addClass('has-error');
    else {
      //assign an unique id to the new email
      if(open_answer_question.choices.length == 0)
        $scope.new_inquiry_choice[open_answer_question.id].id = 1;
      else
        $scope.new_inquiry_choice[open_answer_question.id].id = open_answer_question.choices[open_answer_question.choices.length - 1].id + 1;

      open_answer_question.choices.push(angular.copy($scope.new_inquiry_choice[open_answer_question.id]));

      $scope.new_inquiry_choice[open_answer_question.id].text = '';

      //remove all error classes - just be sure
      $('#new-inquiry-choice').removeClass('has-error');
    }
  }
  
  //copy a choice
  $scope.copyInquiryChoice = function(question, choice) {
    //make a copy of the selected choices
    var new_choice = angular.copy(choice);
    //give it a new id
    new_choice.id = question.choices[question.choices.length - 1].id + 1;
    //insert the new choice into the choices array of question
    question.choices.push(new_choice);
  }
  
  /*** Q-SORT QUESTIONS ***/
  
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
  
  //copy a q-sort question
  $scope.copyInquiryQuestion = function(question) {
    //make a copy of the selected question
    var new_question = angular.copy(question);
    //give it a new id
    new_question.id = $scope.currentModule.input.questions[$scope.currentModule.input.questions.length - 1].id + 1;
    //insert the new question into the questions array
    $scope.currentModule.input.questions.push(new_question);
  }
  
  /*** GLOSSARY ***/
  
  $scope.addInquiryGlossary = function() {
    var can_add_question = true;

    //if a name was not assigned to the new glossary concept
    if($scope.new_inquiry_glossary.name == undefined || $scope.new_inquiry_glossary.name == '') {
      $('#new-inquiry-glossary-name').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-inquiry-glossary-name').removeClass('has-error');

    //if a description was not assigned to the new glossary concept
    if($scope.new_inquiry_glossary.description == undefined || $scope.new_inquiry_glossary.description == '') {
      $('#new-inquiry-glossary-description').addClass('has-error');
      can_add_question = false;
    }
    else
      $('#new-inquiry-glossary-description').removeClass('has-error');

    if(can_add_question) {
      //assign an unique id to the new email
      if($scope.currentModule.input.glossary.length == 0)
        $scope.new_inquiry_glossary.id = 1;
      else
        $scope.new_inquiry_glossary.id = $scope.currentModule.input.glossary[$scope.currentModule.input.glossary.length - 1].id + 1;

      $scope.currentModule.input.glossary.push(angular.copy($scope.new_inquiry_glossary));

      $scope.new_inquiry_glossary.name = '';
      $scope.new_inquiry_glossary.description = '';

      //remove all error classes - just be sure
      $('#new-inquiry-glossary-name').removeClass('has-error');
      $('#new-inquiry-glossary-description').removeClass('has-error');
    }
  }

  $scope.blurInquiryGlossaryName = function(concept) {
    if(concept.name == undefined || concept.name == '')
      $('#inquiry-glossary-name-' + concept.id).addClass('has-error');
    else
      $('#inquiry-glossary-name-' + concept.id).removeClass('has-error');
  }
  
  $scope.blurInquiryGlossaryDescription = function(concept) {
    if(concept.description == undefined || concept.description == '')
      $('#inquiry-glossary-description-' + concept.id).addClass('has-error');
    else
      $('#inquiry-glossary-description-' + concept.id).removeClass('has-error');
  }
  
  //copy a concept
  $scope.copyInquiryConcept = function(concept) {
    //make a copy of the selected concept
    var new_concept = angular.copy(concept);
    //give it a new id
    new_concept.id = $scope.currentModule.input.glossary[$scope.currentModule.input.glossary.length - 1].id + 1;
    //insert the new question into the questions array
    $scope.currentModule.input.glossary.push(new_concept);
  }
  
  /*** SCALE ***/
  
  $scope.blurInquiryScale = function() {
    if($scope.currentModule.input.scale == undefined || $scope.currentModule.input.scale == '')
      $('#inquiry-scale').addClass('has-error');
    else
      $('#inquiry-scale').removeClass('has-error');
  }

});
