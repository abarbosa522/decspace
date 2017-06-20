app.service('InquiryService', function($http, $q) {

  this.startRound = function(username, proj_id, subject, emails, open_answer_questions, questions, current_round, suggestions_toggle) {
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
      new_round.execution_project_id = current_round;
      //who created the round
      new_round.username = username;
      //list of emails
      new_round.emails = emails;
      //list of open answer questions
      new_round.open_answer_questions = open_answer_questions;
      //list of questions
      new_round.questions = questions;
      //survey subject
      new_round.subject = subject;
      //suggestions toggle
      new_round['suggestions toggle'] = suggestions_toggle;
      //generate survey link
      new_round.link = 'http://decspace.sysresearch.org/content/project-management/inquiry-login.html?round=' + new_round.id;

      //add the new list of projects
      $http.post('/inquiry_rounds', new_round).then(function() {
        //create the answer documents
        createAnswerDocs(new_round, questions, open_answer_questions);

        //send the emails with links to the surveys
        sendSurveyLinks(new_round);

        deferred.resolve(new_round);
      });
    });

    return deferred.promise;
  }

  function createAnswerDocs(new_round, questions, open_answer_questions) {
    for(email in new_round['emails']) {
      //create a new answer document
      var new_answer = {};
      //define the corresponding round id
      new_answer.round_id = new_round.id;
      //define the user that created the round
      new_answer.user_creator = new_round.username;
      //define the user that will answer the survey
      new_answer.user = new_round.emails[email].address;
      //define the empty set of answers
      new_answer.questions_answered = [];
      //define the subject survey
      new_answer.subject = new_round.subject;
      //define the suggestions
      new_answer.suggestions = [];
      //define the set of unanswered question
      new_answer.questions_unanswered = [];
      //define the suggestions toggle
      new_answer['suggestions toggle'] = new_round['suggestions toggle'];

      //add the position to the questions - corresponding to the drop box they are in
      //-1 means that the question has not been assigned a drop box
      for(question in questions) {
        var new_question = {};
        new_question.title = questions[question].title;
        new_question.description = questions[question].description;
        new_question.id = questions[question].id;
        new_question.position = -1;
        new_question.score = 'null';
        new_answer.questions_unanswered.push(new_question);
      }

      new_answer.open_answer_questions = open_answer_questions;
      //open answer questions
      for(quest in new_answer.open_answer_questions) {
        new_answer.open_answer_questions[quest].answer = '';
      }

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

      //add the new list of projects
      $http.post('/inquiry_responses', new_answer).then(function() {
      });
    }
  }

  function sendSurveyLinks(new_round) {
    for(email in new_round['emails']) {
      var send_email = {};
      send_email.email = new_round['emails'][email]['address'];
      send_email.link = 'http://decspace.sysresearch.org/content/project-management/inquiry.html?round=' + new_round['id'] + '&user=' + new_round['emails'][email]['address'];

      $http.post('/inquiry_survey', send_email).then(function(response) {
      });
    }
  }

  this.aggregateResults = function(round_id) {
    var deferred = $q.defer();

    //aggregation of all questions' scores
    var questions = [];
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
        for(answer in response2.data)
          if(response2.data[answer]['round_id'] == round_id && response2.data[answer]['questions_answered'].length == questions.length) {
            answer_emails.push({'email' : response2.data[answer]['user'], 'answer_submission_date' : response2.data[answer].usability_metrics.answer_submission_date});

            for(suggestion in response2.data[answer]['suggestions'])
              suggestions.push(response2.data[answer]['suggestions'][suggestion]);

            for(question in response2.data[answer]['questions_answered'])
              for(question2 in questions)
                if(questions[question2]['id'] == response2.data[answer]['questions_answered'][question]['id']) {
                  questions[question2]['total_score'] += response2.data[answer]['questions_answered'][question]['score'];
                  break;
                }

            for(quest in response2.data[answer].open_answer_questions)
              for(quest2 in open_answer_questions)
                if(response2.data[answer].open_answer_questions[quest].question == open_answer_questions[quest2].question)
                  open_answer_questions[quest2][response2.data[answer].user] = response2.data[answer].open_answer_questions[quest].answer;
          }

        //calculate the average score of each question
        for(question in questions) {
          if(answer_emails.length > 0)
            questions[question]['average'] = questions[question]['total_score'] / answer_emails.length;
          else
            questions[question]['average'] = 0;
        }

        deferred.resolve([questions, answer_emails, suggestions, link, open_answer_questions]);
      });
    });

    return deferred.promise;
  }

});
