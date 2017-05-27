app.controller('SRFMethodController', function($scope, $window, $http, SRFService, IntegratedSRFService) {
  /*** SETUP FUNCTIONS ***/

  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  var integrated;

  function defineIntegrated() {
    if(url.includes('srf.html'))
      integrated = false;
    else {
      integrated = true;
      $scope.integratedSRFService = IntegratedSRFService;
    }
  }

  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(typeof res.data.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.data.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').then(function(response) {
          for(account in response.data) {
            if(response.data[account].email == $scope.username) {
              $scope.name = response.data[account].name;
              break;
            }
          }
        });
      }
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response.data[proj]['name'];
          //change the date of the last update of the project
          response.data[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //retrieve the data stored in the database
          $scope.reloadData(false);
          //update the list of executions
          getExecutions();
        });
      });
    });
  }

  function startup() {
    defineIntegrated();

    if(!integrated) {
      requestLogIn();
      rewriteLastUpdate();
    }
  }

  //hide all alerts
  function hideAlerts() {
    $('#save-success').hide();
    $('#reload-success').hide();
  }

  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    //show alert
    angular.element(document.querySelector('#' + alert_id)).alert();
    //hide alert
    angular.element(document.querySelector('#' + alert_id)).fadeTo(3000, 500).slideUp(500, function(){
      angular.element(document.querySelector('#' + alert_id)).slideUp(500);
    });
  }

  /*** BUTTON BAR FUNCTIONS ***/

  //save the current data on the database
  $scope.saveData = function() {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //store criteria
          response.data[proj]['criteria'] = $scope.criteria;
          //store white cards
          response.data[proj]['white_cards'] = $scope.white_cards;
          //store number of rankings
          response.data[proj]['ranking'] = $scope.ranking;
          //store ratio z
          response.data[proj]['ratio_z'] = $scope.ratio_z;
          //store number of decimal places
          response.data[proj]['decimal_places'] = $scope.decimal_places;
          //store the weight type
          response.data[proj]['weight_type'] = $scope.weight_type;

          //get the id of the document
          id_doc = response.data[proj]['_id'];
          //project to store in the db
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          showAlert('save-success');
        });
      });
    });
  }

  //reload the stored data on the database
  $scope.reloadData = function(alertShowing) {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //retrieve criteria
          if(response.data[proj]['criteria'] != undefined)
            $scope.criteria = response.data[proj]['criteria'];

          //retrieve white cards
          if(response.data[proj]['white_cards'] != undefined)
            $scope.white_cards = response.data[proj]['white_cards'];

          //retrieve number of rankings
          if(response.data[proj]['ranking'] != undefined)
            $scope.ranking = response.data[proj]['ranking'];

          //retrieve ratio z
          if(response.data[proj]['ratio_z'] != undefined)
            $scope.ratio_z = response.data[proj]['ratio_z'];

          //retrieve number of decimal places
          if(response.data[proj]['decimal_places'] != undefined)
            $scope.decimal_places = response.data[proj]['decimal_places'];

          //retrieve weight type
          if(response.data[proj]['weight_type'] != undefined)
            $scope.weight_type = response.data[proj]['weight_type'];

          if(alertShowing)
            showAlert('reload-success');

          break;
        }
      }
    });
  }

  //confirm reset of the current data
  $scope.confirmResetData = function() {
    //reset the input data
    $scope.criteria = [];
    $scope.white_cards = [];
    $scope.ranking = 2;
    $scope.ratio_z = null;
    $scope.decimal_places = null;
    $scope.weight_type = null;
  }

  /*** IMPORT AND EXPORT FUNCTIONS ***/

  //import the files of the checked boxes
  $scope.importData = function() {
    if(angular.element(document.querySelector('#import-criteria-check')).prop('checked')) {
      importFile('import-criteria-file');
    }
    if(angular.element(document.querySelector('#import-white-cards-check')).prop('checked')) {
      importFile('import-white-cards-file');
    }
    if(angular.element(document.querySelector('#import-ranking-check')).prop('checked')) {
      importFile('import-ranking-file');
    }
    if(angular.element(document.querySelector('#import-ratio-z-check')).prop('checked')) {
      importFile('import-ratio-z-file');
    }
    if(angular.element(document.querySelector('#import-decimal-places-check')).prop('checked')) {
      importFile('import-decimal-places-file');
    }
    if(angular.element(document.querySelector('#import-weight-type-check')).prop('checked')) {
      importFile('import-weight-type-file');
    }
  }

  //import file according to its extension
  function importFile(input_id) {
    var file_input = document.getElementById(input_id);

    var reader = new FileReader();

    var data = [];

    //called when readAsText is performed
    reader.onload = (function(file) {
      var file_extension = file.name.split('.').pop();

      //imported file is a csv file
      if(file_extension == 'csv') {
        return function(e) {
          var rows = e.target.result.split("\n");

          for(row in rows)
            rows[row] = rows[row].trim();

          var columns = rows[0].split(";");

          //remove whitespaces and empty strings
          for(column in columns)
            columns[column] = columns[column].trim();

          for(var i = 1; i < rows.length; i++) {
            var cells = rows[i].split(";");
            var element = {};

            //add the unique id
            element['id'] = i;

            for(var j = 0; j < cells.length; j++)
              if(cells[j].trim() != '' && columns[j].trim() != '')
                element[columns[j]] = cells[j];

            if(!angular.equals(element, {}))
              data.push(element);
          }
          $scope.$apply(fileConverter(input_id, data));
        };
      }
      //imported file is a json file
      else if(file_extension == 'json') {
        return function(e) {
          var rows = e.target.result.split("\n");

          for(row in rows) {
            var element = JSON.parse(rows[row]);
            element['id'] = Number(row) + 1;
            data.push(element);
          }

          $scope.$apply(fileConverter(input_id, data));
        }
      }
    })(file_input.files[0]);

    //get the data from the file
    reader.readAsText(file_input.files[0]);
  }

  //get the converted data as the current data
  function fileConverter(input_id, data) {
    switch(input_id) {
      case 'import-criteria-file':
        $scope.criteria = data;
        break;

      case 'import-white-cards-file':
        $scope.white_cards = data;
        break;

      case 'import-ranking-file':
        $scope.ranking = Number(data[0]['ranking']);
        break;

      case 'import-ratio-z-file':
        $scope.ratio_z = Number(data[0]['ratio-z']);
        break;

      case 'import-decimal-places-file':
        $scope.decimal_places = String(data[0]['decimal-places']);
        break;

      case 'import-weight-type-file':
        $scope.weight_type = String(data[0]['weight-type']);
        break;
    }
  }

  //select all import checkboxes
  $scope.selectAllImport = function() {
    document.getElementById('import-criteria-check').checked = true;
    document.getElementById('import-white-cards-check').checked = true;
    document.getElementById('import-ranking-check').checked = true;
    document.getElementById('import-ratio-z-check').checked = true;
    document.getElementById('import-decimal-places-check').checked = true;
    document.getElementById('import-weight-type-check').checked = true;
  }

  //deselect all import checkboxes
  $scope.selectNoneImport = function() {
    document.getElementById('import-criteria-check').checked = false;
    document.getElementById('import-white-cards-check').checked = false;
    document.getElementById('import-ranking-check').checked = false;
    document.getElementById('import-ratio-z-check').checked = false;
    document.getElementById('import-decimal-places-check').checked = false;
    document.getElementById('import-weight-type-check').checked = false;
  }

  //export the selected data
  $scope.exportData = function() {
    //export emails to csv
    if(angular.element(document.querySelector('#export-criteria-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'name;position\n';

      for(criterion in $scope.criteria)
        csv_str += $scope.criteria[criterion]['name'] + ';' + $scope.criteria[criterion]['position'] + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'criteria.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-criteria-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(criterion in $scope.criteria) {
        var json_element = {};

        for(field in $scope.criteria[criterion]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.criteria[criterion][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'criteria.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-white-cards-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'position\n';

      for(white_card in $scope.white_cards)
        csv_str += $scope.white_cards[white_card]['position'] + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'white_cards.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-white-cards-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(white_card in $scope.white_cards) {
        var json_element = {};

        for(field in $scope.white_cards[white_card]) {
          if(field != 'id' && field != '$$hashKey' && field != 'white_card')
            json_element[field] = $scope.white_cards[white_card][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'white_cards.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-ranking-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'ranking\n';

      csv_str += $scope.ranking + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'ranking.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-ranking-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      var json_element = {};

      json_element['ranking'] = $scope.ranking;

      json_str += JSON.stringify(json_element) + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'ranking.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-ratio-z-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'ratio-z\n';

      csv_str += $scope.ratio_z + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'ratio_z.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-ratio-z-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      var json_element = {};

      json_element['ratio-z'] = $scope.ratio_z;

      json_str += JSON.stringify(json_element) + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'ratio_z.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-decimal-places-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'decimal-places\n';

      csv_str += $scope.decimal_places + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'decimal_places.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-decimal-places-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      var json_element = {};

      json_element['decimal-places'] = $scope.decimal_places;

      json_str += JSON.stringify(json_element) + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'decimal_places.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-weight-type-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'weight-type\n';

      csv_str += $scope.weight_type + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'weight_type.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-weight-type-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      var json_element = {};

      json_element['weight-type'] = $scope.weight_type;

      json_str += JSON.stringify(json_element) + '\n';

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'weight_type.json';
      hidden_element.click();
    }
  }

  //select all export checkboxes
  $scope.selectAllExport = function() {
    document.getElementById('export-criteria-check').checked = true;
    document.getElementById('export-white-cards-check').checked = true;
    document.getElementById('export-ranking-check').checked = true;
    document.getElementById('export-ratio-z-check').checked = true;
    document.getElementById('export-decimal-places-check').checked = true;
    document.getElementById('export-weight-type-check').checked = true;
  }

  //deselect all export checkboxes
  $scope.selectNoneExport = function() {
    document.getElementById('export-criteria-check').checked = false;
    document.getElementById('export-white-cards-check').checked = false;
    document.getElementById('export-ranking-check').checked = false;
    document.getElementById('export-ratio-z-check').checked = false;
    document.getElementById('export-decimal-places-check').checked = false;
    document.getElementById('export-weight-type-check').checked = false;
  }

  /*** INPUT DATA - CRITERIA ***/

  //variable that stores all the current criteria
  $scope.criteria = [];

  //variable that holds the criterion that is selected to be deleted
  $scope.delete_criterion = '';

  //variable that controls the showing/hiding of the criteria
  $scope.criteria_eye = 1;

  //variable that holds the input data of a new criterion
  $scope.new_criterion = {};

  //add a new criterion
  $scope.addCriterion = function() {
    if($scope.new_criterion.name == '' || $scope.new_criterion.name == undefined)
      $('#new-criterion-name').addClass('has-error');
    else {
      if($scope.criteria.length == 0)
        $scope.new_criterion.id = 1;
      else
        $scope.new_criterion.id = $scope.criteria[$scope.criteria.length - 1]['id'] + 1;

      //criterion starts unassigned to any rank
      $scope.new_criterion.position = -1;

      $scope.criteria.push(angular.copy($scope.new_criterion));

      $scope.new_criterion.name = '';
      $('#new-criterion-name').removeClass('has-error');
    }
  }

  $scope.blurCriterion = function(criterion) {
    if(criterion.name == '')
      $('#criterion-' + criterion.id + '-name').addClass('has-error');
    else
      $('#criterion-' + criterion.id + '-name').removeClass('has-error');
  }

  //delete a certain criterion
  $scope.deleteCriterion = function(criterion) {
    $scope.delete_criterion = criterion.id;
  }

  //confirm the criterion deletion
  $scope.confirmDeleteCriterion = function(criterion) {
    $scope.criteria.splice($scope.criteria.indexOf(criterion), 1);
    $scope.delete_criterion = '';
  }

  //cancel the criterion deletion
  $scope.cancelDeleteCriterion = function() {
    $scope.delete_criterion = '';
  }

  /*** INPUT DATA - WHITE CARDS ***/

  //white card available to be dragged
  $scope.white_card = {
    'white_card' : true,
    'id' : 0
  };

  //dragged white cards
  $scope.white_cards = [];

  /*** INPUT DATA - RANKING ***/

  //variable that stores all the current ranking positions
  $scope.ranking = 2;

  //variable that controls the showing/hiding of the ranking
  $scope.ranking_eye = 1;

  //create an array the size of $scope.ranking so that it can be used by ng-repeat
  $scope.rangeRepeater = function(count) {
    return new Array(count);
  };

  //increment the number of rankings
  $scope.addRanking = function(index) {
    for(criterion in $scope.criteria)
      if($scope.criteria[criterion]['position'] > index)
        $scope.criteria[criterion]['position']++;

    for(white_card in $scope.white_cards)
      if($scope.white_cards[white_card]['position'] > index)
        $scope.white_cards[white_card]['position']++;

    $scope.ranking++;
  }

  $scope.removeRanking = function(index) {
    //don't allow less than 2 rankings
    if($scope.ranking > 2) {

      for(criterion in $scope.criteria) {
        if($scope.criteria[criterion]['position'] > index)
          $scope.criteria[criterion]['position']--;
        else if($scope.criteria[criterion]['position'] == index)
          $scope.criteria[criterion]['position'] = -1;
      }

      for(white_card in $scope.white_cards) {
        if($scope.white_cards[white_card]['position'] > index)
          $scope.white_cards[white_card]['position']--;
        else if($scope.white_cards[white_card]['position'] == index)
          $scope.white_cards[white_card]['position'] = -1;
      }

      $scope.ranking--;
    }
  }

  /*** INPUT DATA - OTHER PARAMETERS ***/

  //stores the value of the ratio z
  $scope.ratio_z = null;

  //stores the value of the number of decimal places
  $scope.decimal_places = null;

  //stores the type of the result weights
  $scope.weight_type = null;

  //controls the showing/hiding of the other parameters
  $scope.param_eye = 1;

  $scope.blurRatioZ = function() {
    if($scope.ratio_z == '' || $scope.ratio_z == undefined)
      $('#ratio-z').addClass('has-error');
    else
      $('#ratio-z').removeClass('has-error');
  }

  $scope.blurDecimalPlaces = function() {
    if($scope.decimal_places == undefined || $scope.decimal_places == '')
      $('#decimal-places').addClass('has-error');
    else
      $('#decimal-places').removeClass('has-error');
  }

  $scope.blurWeightType = function() {
    if($scope.weight_type == undefined || $scope.weight_type == '')
      $('#weight-type').addClass('has-error');
    else
      $('#weight-type').removeClass('has-error');
  }

  /*** DRAG AND DROP FUNCTIONS ***/

  //change a card's ranking position
  $scope.rankingDrop = function(data, index) {
    //if the white card on the original drop was dragged
    if(data['white_card'] && data['id'] == 0 && noCriteriaCards(index)) {
      var new_white_card = {
        'position' : index,
        'id' : $scope.white_cards.length + 1,
        'white_card' : true
      };

      $scope.$apply($scope.white_cards.push(new_white_card));
    }
    //if a criteria card was dragged or a white card previously dragged was dragged once more
    else if((data['white_card'] == undefined && noWhiteCards(index)) || (data['white_card'] && noCriteriaCards(index)))
      data['position'] = index;
  }

  //put a criteria card back into the original drop
  $scope.originalCriteriaDrop = function(data) {
    if(data['white_card'] == undefined)
      data['position'] = -1;
  }

  //put a white card back into the original drop
  $scope.originalWhiteDrop = function(data) {
    if(data['white_card'] && data['id'] != 0) {
      data['position'] = -1;
      $scope.$apply($scope.white_cards);
    }
  }

  //check if there are any white cards in the index ranking
  function noCriteriaCards(index) {
    for(criterion in $scope.criteria)
      if($scope.criteria[criterion]['position'] == index)
        return false;

    return true;
  }

  //check if there are any criteria cards in the index ranking
  function noWhiteCards(index) {
    for(white in $scope.white_cards)
      if($scope.white_cards[white]['position'] == index)
        return false;

    return true;
  }

  /*** EXECUTIONS AND RESULTS FUNCTIONS ***/

  //variables that control the showing/hiding of the results tables
  $scope.criteria_exec_eye = 1;
  $scope.ranking_exec_eye = 1;
  $scope.parameters_exec_eye = 1;
  $scope.results_exec_eye = 1;

  //retrieve the executions stored in the database
  function getExecutions() {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the actions previously added
          $scope.executions = response.data[proj]['executions'];
          break;
        }
      }
    });
  }

  //variable that shows/hides the loading button
  $scope.isLoading = false;

  //execute the SRF method and return the corresponding results
  $scope.getResults = function() {
    //show loading button
    $scope.isLoading = true;

    var results = SRFService.getResults($scope.criteria, $scope.white_cards, $scope.ranking, $scope.ratio_z, $scope.decimal_places, $scope.weight_type);

    $http.get('/projects').then(function(response) {
      //get current date
      var current_date = new Date();
      var execution_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear() + ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

      //if a comment has not been added
      if(typeof $scope.new_execution == 'undefined')
        var comment = '';
      else
        var comment = $scope.new_execution.comment;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the largest execution_id
          var execution_id;
          if(response.data[proj]['executions'].length == 0)
            execution_id = 1;
          else
            execution_id = response.data[proj]['executions'][response.data[proj]['executions'].length - 1]['id'] + 1;

          //insert execution into database
          response.data[proj]['executions'].push({'id':execution_id,'results':results,'comment':comment,
            'criteria':$scope.criteria,'white_cards':$scope.white_cards,'ranking':$scope.ranking,
            'ratio_z':$scope.ratio_z,'decimal_places':$scope.decimal_places,'weight_type':$scope.weight_type,
            'execution_date':execution_date});

          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          getExecutions();

          //reset the comment input field, if it was filled
          if(typeof $scope.new_execution != 'undefined')
            $scope.new_execution.comment = '';

          //hide loading button
          $scope.isLoading = false;
        });
      });
    });
  }

  //execute the SRF method and return the corresponding results to the integrated version
  $scope.getIntegratedResults = function() {

    var results = SRFService.getResults($scope.integratedSRFService.integrated_criteria, $scope.white_cards, $scope.ranking, $scope.ratio_z, $scope.decimal_places, $scope.weight_type);

    var new_results = [];

    for(result in results) {
      if($scope.weight_type == 'Non-Normalized')
        new_results[results[result]['name']] = results[result]['non-normalized weight'];
      else
        new_results[results[result]['name']] = results[result]['normalized weight'];
    }

    $scope.integratedSRFService.integrated_results = new_results;
  }

  //variable that controls the execution to show
  $scope.currentExecution = '';

  //variable that controls the execution to compare
  $scope.compareExecution = '';

  //show modal with execution details
  $scope.showExecution = function(execution) {
    $scope.currentExecution = execution;
    $scope.compareExecution = '';
  }

  //show the execution to compare with
  $scope.showCompareExecution = function(execution) {
    $scope.compareExecution = execution;
  }

  //variable that controls the selected execution to be deleted
  $scope.deleteIdExecution = '';

  //select an execution to be deleted
  $scope.deleteExecution = function(execution) {
    $scope.deleteIdExecution = execution.id;
  }

  //confirm execution deletion
  $scope.confirmDeleteExecution = function(execution) {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          for(exec in response.data[proj]['executions']) {
            if(response.data[proj]['executions'][exec]['execution_id'] == execution.execution_id) {
              response.data[proj]['executions'].splice(exec, 1);
              //get the id of the document, so that it can be removed from the db
              id_doc = response.data[proj]['_id'];
              //project to store in the db
              proj_res = response.data[proj];
              delete proj_res['_id'];
              break;
            }
          }
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //refresh the list of projects
          getExecutions();
        });
      });
    });
  }

  //cancel execution deletion
  $scope.cancelDeleteExecution = function() {
    $scope.deleteIdExecution = '';
  }

  //select all executions to be deleted
  $scope.deleteAllExecutions = function() {
    $scope.deleteIdExecution = 'all';
  }

  //confirm the deletion of all executions of the current project
  $scope.confirmDeleteAllExecutions = function() {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          response.data[proj]['executions'] = [];
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //refresh the list of executions
          getExecutions();
          //reset delete variable
          $scope.deleteIdExecution = '';
        });
      });
    });
  }

  //cancel the deletion of all executions
  $scope.cancelDeleteAllExecutions = function() {
    $scope.deleteIdExecution = '';
  }

  /*** STARTUP FUNCTIONS ***/
  startup();
  hideAlerts();
});
