app.service('InquiryService', function($http, $q) {
  var self = this;

  this.startRound = function(username, proj_id, mod_input) {
    var deferred = $q.defer();

    $http.get('/inquiry_rounds').then(function(response) {
      //get the largest round id
      var id = 0;

      for(round in response.data)
        if(response.data[round].id > id)
          id = response.data[round].id;

      id++;

      //create the new round
      var new_round = {};
      //define the id of the round
      new_round.id = id;
      //project this round belongs to
      new_round.project_id = proj_id;
      //id in the project context
      new_round.execution_project_id = mod_input.current_round;
      //who created the round
      new_round.username = username;
      //list of emails
      new_round.emails = mod_input.emails;
      //list of open answer questions
      new_round.open_answer_questions = mod_input.open_answer_questions;
      //list of questions
      new_round.questions = mod_input.questions;
      //survey subject
      new_round.subject = mod_input.subject;
      //survey description
      new_round.description = mod_input.description;
      //suggestions toggle
      new_round.suggestions_toggle = mod_input.suggestions_toggle;
      //generate survey link
      new_round.link = 'http://decspace.sysresearch.org/content/project-management/inquiry-login.html?r=' + new_round.id;
      //color scheme
      new_round.color_scheme = mod_input.color_scheme;
      //glossary
      new_round.glossary = mod_input.glossary;
      //scale
      new_round.scale = mod_input.scale;
      //ask characterization questions survey link
      new_round.ask_characterization_questions_survey_link = mod_input.ask_characterization_questions_survey_link;
      
      //add the new list of projects
      $http.post('/inquiry_rounds', new_round).then(function() {
        //create the answer documents
        createAnswerDocs(new_round);

        //send the emails with links to the surveys
        sendSurveyLinks(new_round, mod_input.personalized_email, mod_input.email_content);

        deferred.resolve(new_round);
      });
    });

    return deferred.promise;
  }

  function createAnswerDocs(new_round) {
    for(email in new_round.emails)
      self.createAnswerData(new_round, new_round.emails[email].address, '', '', 'approved', true, new_round.emails[email].ask_characterization_questions);
  }

  this.createAnswerData = function(new_round, email, name, affiliation, status, direct_email, ask_characterization_questions) {
    //create a new answer document
    var new_answer = {};
    //define the corresponding round id
    new_answer.round_id = new_round.id;
    //define the user that created the round
    new_answer.user_creator = new_round.username;
    //define the user that will answer the survey
    new_answer.user = email;
    new_answer.name = name;
    new_answer.affiliation = affiliation;
    //define the subject survey
    new_answer.subject = new_round.subject;
    //define the survey description
    new_answer.description = new_round.description;
    //define the suggestions
    new_answer.suggestions = [];
    //define the suggestions toggle
    new_answer.suggestions_toggle = new_round.suggestions_toggle;
    //color scheme
    new_answer.color_scheme = new_round.color_scheme;
    //glossray
    new_answer.glossary = new_round.glossary;
    //scale
    new_answer.scale = new_round.scale;
    //status
    new_answer.status = status;
    //answer document creation date
    var current_date = new Date();
    new_answer.request_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
    new_answer.request_date += ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();
    
    new_answer.ask_characterization_questions = ask_characterization_questions;
    
    //define the set of questions
    new_answer.questions = [];

    //add the position to the questions - corresponding to the drop box they are in
    //-1 means that the question has not been assigned a drop box
    for(question in new_round.questions) {
      var new_question = {};
      new_question.title = new_round.questions[question].title;
      new_question.description = new_round.questions[question].description;
      new_question.id = new_round.questions[question].id;
      new_question.position = -1;
      new_question.score = 'null';
      new_answer.questions.push(new_question);
    }

    new_answer.open_answer_questions = new_round.open_answer_questions;
    //open answer questions
    for(quest in new_answer.open_answer_questions)
      new_answer.open_answer_questions[quest].answer = '';
    
    //usability metrics
    new_answer['usability_metrics'] = {};
    new_answer['usability_metrics']['log_ins'] = 0;
    new_answer['usability_metrics']['task_duration'] = '';
    new_answer['usability_metrics']['drag_and_drops'] = 0;
    new_answer['usability_metrics']['added_suggestions'] = 0;
    new_answer['usability_metrics']['confirmed_deletion_suggestion'] = 0;
    new_answer['usability_metrics']['canceled_deletion_suggestion'] = 0;
    new_answer['usability_metrics']['data_saves'] = 0;
    new_answer['usability_metrics']['confirmed_data_resets'] = 0;
    new_answer['usability_metrics']['canceled_data_resets'] = 0;
    new_answer['usability_metrics']['data_reloads'] = 0;
    new_answer['usability_metrics']['help_modal_open'] = 0;
    new_answer['usability_metrics']['task_complete'] = '';
    new_answer['usability_metrics']['incomplete_saves'] = 0;
    
    //the system sent a direct email
    if(direct_email)
      new_answer.direct_email = true;
    
    //add the new answer document
    $http.post('/inquiry_responses', new_answer);
  }
  
  function sendSurveyLinks(new_round, personalized_email, email_content) {
    for(email in new_round['emails']) {
      var send_email = {};
      send_email.email = new_round['emails'][email]['address'];
      send_email.link = 'http://decspace.sysresearch.org/content/project-management/inquiry.html?r=' + 
        new_round['id'] + '&u=' + new_round['emails'][email]['address'];

      if(!personalized_email)
        $http.post('/default_inquiry_survey', send_email).then(function(response) {});
      else {
        send_email.subject = email_content.subject;
        send_email.text = email_content.text;

        $http.post('/personalized_inquiry_survey', send_email).then(function(response) {});
      }
    }
  }
  
  this.sendSurveyLink = function(new_round, email) {
    var send_email = {
      'email' : email,
      'link' : 'http://decspace.sysresearch.org/content/project-management/inquiry.html?r=' + new_round.round_id + '&u=' + email
    };
    
    if(!new_round.personalized_email)
      $http.post('/default_inquiry_survey', send_email);
    else {
      send_email.subject = new_round.email.subject;
      send_email.text = new_round.email.text;
      
      $http.post('/personalized_inquiry_survey', send_email);
    }
  }
  
  this.aggregateResults = function(round_id) {
    var deferred = $q.defer();

    //aggregation of all questions' scores
    var questions = [];
    //emails of the users waiting for approval
    var pending_emails = [];
    //emails of the users that answered
    var answer_emails = [];
    //aggregation of all suggestions
    var suggestions = [];
    //survey link
    var link = '';
    //aggregation of open answer questions
    var open_answer_questions = [];

    $http.get('/inquiry_rounds').then(function(response) {
      for(round in response.data) {
        if(response.data[round]['id'] == round_id) {
          link = response.data[round]['link'];
          for(question in response.data[round]['questions']) {
            var new_question = {};
            new_question['id'] = response.data[round]['questions'][question]['id'];
            new_question['title'] = response.data[round]['questions'][question]['title'];
            new_question['description'] = response.data[round]['questions'][question]['description'];
            new_question['total_score'] = 0;
            new_question['average'] = 0;
            new_question['individual_scores'] = [];
            questions.push(new_question);
          }

          for(quest in response.data[round].open_answer_questions) {
            var new_quest = {};
            new_quest.question = response.data[round].open_answer_questions[quest].question;
            open_answer_questions.push(new_quest);
          }

          break;
        }
      }

      $http.get('/inquiry_responses').then(function(response2) {
        //calculate the total score of each question, as well as the total number of answers
        for(answer in response2.data) {
          if(response2.data[answer].round_id == round_id && response2.data[answer].status == 'pending')
            pending_emails.push({'name' : response2.data[answer].name, 'email' : response2.data[answer].user, 'affiliation' : response2.data[answer].affiliation, 'request_date' : response2.data[answer].request_date});
          else if(response2.data[answer].round_id == round_id && response2.data[answer].usability_metrics.task_complete) {
            answer_emails.push({'email' : response2.data[answer].user, 'answer_submission_date' : response2.data[answer].usability_metrics.answer_submission_date});

            for(suggestion in response2.data[answer].suggestions)
              suggestions.push(response2.data[answer]['suggestions'][suggestion]);

            for(question in response2.data[answer].questions)
              for(question2 in questions)
                if(questions[question2]['id'] == response2.data[answer].questions[question]['id']) {
                  questions[question2]['total_score'] += response2.data[answer].questions[question]['score'];
                  questions[question2]['individual_scores'].push(response2.data[answer].questions[question]['score']);
                  break;
                }

            for(quest in response2.data[answer].open_answer_questions)
              for(quest2 in open_answer_questions)
                if(response2.data[answer].open_answer_questions[quest].question == open_answer_questions[quest2].question)
                  open_answer_questions[quest2][response2.data[answer].user] = response2.data[answer].open_answer_questions[quest].answer;
          }
        }

        //calculate the average score and standard deviation of each question
        for(question in questions) {
          if(answer_emails.length > 0) {
            questions[question]['average'] = questions[question]['total_score'] / answer_emails.length;
            questions[question]['standard_deviation'] = calculateStandardDeviation(questions[question], answer_emails.length);
          }
          else {
            questions[question]['average'] = 0;
            questions[question]['standard_deviation'] = 0;
          }
        }

        deferred.resolve([questions, answer_emails, suggestions, link, open_answer_questions, pending_emails]);
      });
    });

    return deferred.promise;
  }


  function calculateStandardDeviation(question, answer_emails_length) {
    var sum_deviations = 0;

    for(score in question['individual_scores'])
      sum_deviations += Math.pow(question['individual_scores'][score] - question['average'], 2);

    sum_deviations = sum_deviations / question['individual_scores'].length;

    return Math.sqrt(sum_deviations);
  }
});
