app.service('DelphiService', function($http, $q) {

  this.aggregateResults = function(round_id) {
    var deferred = $q.defer();

    //aggregation of all questions' scores
    var questions = [];
    //emails of the users that answered
    var answer_emails = [];

    $http.get('/delphi_rounds').success(function(response) {
      for(round in response) {
        if(response[round]['id'] == round_id) {
          for(question in response[round]['questions']) {
            var new_question = {};
            new_question['total_score'] = 0;
            new_question['average'] = 0;
            new_question['content'] = response[round]['questions'][question]['content'];
            new_question['id'] = response[round]['questions'][question]['id'];
            questions.push(new_question);
          }

          break;
        }
      }

      $http.get('/delphi_responses').success(function(response2) {
        //calculate the total score of each question, as well as the total number of answers
        for(answer in response2)
          if(response2[answer]['round_id'] == round_id && response2[answer]['questions_answered'].length == questions.length) {
            answer_emails.push(response2[answer]['user']);

            for(question in response2[answer]['questions_answered'])
              for(question2 in questions)
                if(questions[question2]['id'] == response2[answer]['questions_answered'][question]['id']) {
                  questions[question2]['total_score'] += response2[answer]['questions_answered'][question]['score'];
                  break;
                }
          }

        //calculare the average score of each question
        for(question in questions) {
          if(answer_emails.length > 0)
            questions[question]['average'] = questions[question]['total_score'] / answer_emails.length;
          else
            questions[question]['average'] = 0;
        }

        deferred.resolve([questions, answer_emails]);
      });
    });

    return deferred.promise;
  }

});
