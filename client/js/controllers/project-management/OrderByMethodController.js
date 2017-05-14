app.controller('OrderByMethodController', function($scope, $window, $http, OrderByService) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  $scope.criteria = [];
  $scope.deleteIdCriterion = '';

  $scope.actions = [];
  $scope.deleteIdAction = '';

  $scope.deleteIdExecution = '';

  $scope.showResetData = false;

  //eye icons variables
  $scope.criteria_eye = 1;
  $scope.actions_eye = 1;

  //eye icons variables - executions
  $scope.criteria_exec_eye = 1;
  $scope.actions_exec_eye = 1;
  $scope.results_exec_eye = 1;

  $scope.currentExecution = '';
  $scope.compareExecution = '';

  //order that data should be retrieved from db
  var currentOrderCriteria = ['', ''], currentOrderActions = ['', ''];

  $scope.isLoading = false;

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
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          //get the name of the project
          $scope.project_name = response.data[proj].name;
          //change the date of the last update of the project
          response.data[proj].last_update = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          getCriteria();
          getActions();
          getExecutions();
        });
      });
    });
  }

  function getCriteria() {
    $http.get('/projects').then(function(response) {
      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          if(response.data[proj].criteria == undefined)
            $scope.criteria = [];
          else
            $scope.criteria = response.data[proj].criteria;

          break;
        }
      }
    });
  }

  //get the number of parameters of a scope variable
  function getNumberOfFields(scope_var) {
    var i = 0;

    for(field in scope_var)
      i++;

    return i;
  }

  $scope.addCriterion = function() {
    //don't allow any of the fields to be empty - name, type and direction
    if(getNumberOfFields($scope.new_criterion) < 3 || $scope.new_criterion.name == '' || $scope.new_criterion.type == '' || $scope.new_criterion.direction == '') {
      $scope.showCriterionFieldsError = true;
      $scope.showCriterionNameError = false;
    }
    //check if any there is another criterion with the same name - do not allow that
    else {
      $scope.showCriterionFieldsError = false;
      $scope.showCriterionNameError = false;

      for(criterion in $scope.criteria) {
        if($scope.new_criterion.name == $scope.criteria[criterion]['name']) {
          $scope.showCriterionNameError = true;
          break;
        }
      }

      if($scope.criteria.length == 0)
        $scope.new_criterion.id = 1;
      else
        $scope.new_criterion.id = $scope.criteria[$scope.criteria.length - 1]['id'] + 1;

      $scope.new_criterion.selected = 'false';

      $scope.criteria.push(angular.copy($scope.new_criterion));

      $scope.new_criterion.name = '';
      $scope.new_criterion.type = '';
      $scope.new_criterion.direction = '';
    }
  }

  //delete a certain criterion
  $scope.deleteCriterion = function(criterion) {
    $scope.deleteIdCriterion = criterion.id;
  }

  $scope.confirmDeleteCriterion = function(criterion) {
    $scope.criteria.splice($scope.criteria.indexOf(criterion), 1);
    $scope.deleteIdCriterion = '';
  }

  $scope.cancelDeleteCriterion = function() {
    $scope.deleteIdCriterion = '';
  }

  $scope.selectCriterion = function(criterion) {
    for(crt in $scope.criteria) {
      if($scope.criteria[crt]['name'] == criterion['name'])
        $scope.criteria[crt]['selected'] = 'true';
      else
        $scope.criteria[crt]['selected'] = 'false';
    }
  }

  function getActions() {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          //get the actions previously added
          if(response.data[proj].actions == undefined)
            $scope.actions = [];
          else
            $scope.actions = response.data[proj].actions;

          break;
        }
      }
    });
  }

  $scope.addAction = function() {
    //don't allow to insert an action with an empty field
    if(getNumberOfFields($scope.new_action) <= $scope.criteria.length) {
      $scope.showActionFieldsError = true;
      $scope.showActionNameError = false;
    }
    //don't actions with the same name
    else {
      $scope.showActionFieldsError = false;
      $scope.showActionNameError = false;

      for(action in $scope.actions) {
        if($scope.new_action.name == $scope.actions[action]['name']) {
          $scope.showActionNameError = true;
          break;
        }
      }

      if($scope.actions.length == 0)
        $scope.new_action.id = 1;
      else
        $scope.new_action.id = $scope.actions[$scope.actions.length - 1]['id'] + 1;

      $scope.actions.push(angular.copy($scope.new_action));

      $scope.new_action.name = '';

      for(criterion in $scope.criteria)
        $scope.new_action[$scope.criteria[criterion]['name']] = '';

    }
  }

  //delete a certain criterion
  $scope.deleteAction = function(action) {
    $scope.deleteIdAction = action.id;
  }

  $scope.confirmDeleteAction = function(action) {
    $scope.actions.splice($scope.actions.indexOf(action), 1);
    $scope.deleteIdAction = '';
  }

  $scope.cancelDeleteAction = function() {
    $scope.deleteIdAction = '';
  }

  function getExecutions() {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          //get the actions previously added
          $scope.executions = response.data[proj].executions;
          break;
        }
      }
    });
  }

  $scope.getResults = function() {
    //check if any criteria was added
    if($scope.criteria.length == 0) {
      $scope.showNoCriteriaError = true;
      $scope.showNoActionsError = false;
    }
    //check if any actions were added
    else if($scope.actions.length == 0) {
      $scope.showNoCriteriaError = false;
      $scope.showNoActionsError = true;
    }
    else {
      $scope.showNoCriteriaError = false;
      $scope.showNoActionsError = false;
      $scope.showOrderError = false;

      //show loading button
      $scope.isLoading = true;

      var results = OrderByService.getResults($scope.criteria, $scope.actions);

      $http.get('/projects').then(function(response) {
        //get current date
        var current_date = new Date();
        var execution_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear() + ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

        //if a comment has not been added
        if(typeof $scope.new_execution == 'undefined') {
          var comment = '';
        }
        else {
          var comment = $scope.new_execution.comment;
        }

        for(proj in response.data) {
          if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
            //get the largest execution_id
            var execution_id
            if(response.data[proj].executions.length == 0)
              execution_id = 1;
            else
              execution_id = response.data[proj].executions[response.data[proj].execution.length - 1].execution_id + 1;

            //insert execution into database
            var new_exec = {};
            new_exec.execution_id = execution_id;
            new_exec.criteria = $scope.criteria;
            new_exec.actions = $scope.actions;
            new_exec.results = results;
            new_exec.comment = comment;
            new_exec.execution_date = execution_date;
            response.data[proj].executions.push(new_exec);

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

            $scope.isLoading = false;
          });
        });
      });
    }
  }

  $scope.saveData = function() {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {

          //insert criteria
          response.data[proj].criteria = $scope.criteria;
          //insert actions
          response.data[proj].actions = $scope.actions;

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
          $scope.showSaveSuccess = true;
        });
      });
    });
  }

  $scope.changeSaveSuccess = function() {
    $scope.showSaveSuccess = false;
  }

  $scope.reloadData = function() {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          if(response.data[proj].criteria != undefined)
            $scope.criteria = response.data[proj].criteria;

          if(response.data[proj].actions != undefined)
            $scope.actions = response.data[proj].actions;

          break;
        }
      }
    });
  }

  $scope.resetData = function() {
    $scope.showResetData = true;
  }

  $scope.confirmResetData = function() {
    $scope.criteria = [];
    $scope.actions = [];
    $scope.showResetData = false;
  }

  $scope.cancelResetData = function() {
    $scope.showResetData = false;
  }

  $scope.importData = function() {
    if(angular.element(document.querySelector('#import-criteria-check')).prop('checked')) {
      importFile('import-criteria-file');
    }
    if(angular.element(document.querySelector('#import-actions-check')).prop('checked')) {
      importFile('import-actions-file');
    }
  }

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

          for(i = 1; i < rows.length; i++) {
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

          $scope.$apply(fileConverter(input_id,data));
        }
      }
    })(file_input.files[0]);

    //get the data from the file
    reader.readAsText(file_input.files[0]);
  }

  function fileConverter(input_id, data) {
    switch(input_id) {
      case 'import-criteria-file':
        $scope.criteria = data;
        break;

      case 'import-actions-file':
        for(action in data)
          for(field in data[action])
            data[action][field] = data[action][field];

        $scope.actions = data;
        break;
    }
  }

  $scope.exportData = function() {
    //export criteria to csv
    if(angular.element(document.querySelector('#export-criteria-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(criterion in $scope.criteria) {
        for(field in $scope.criteria[criterion])
          if(field != 'id' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(criterion in $scope.criteria) {
        for(field in $scope.criteria[criterion])
          if(field != 'id' && field != '$$hashKey')
            csv_str += $scope.criteria[criterion][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

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
    if(angular.element(document.querySelector('#export-actions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      csv_str += 'Name;';

      for(criterion in $scope.criteria)
        csv_str += $scope.criteria[criterion]['name'] + ';';

      csv_str = csv_str.substring(0, csv_str.length - 1);
      csv_str += '\n';

      for(action in $scope.actions) {
        csv_str += $scope.actions[action]['name'] + ';';

        for(criterion in $scope.criteria) {
          csv_str += $scope.actions[action][$scope.criteria[criterion]['name']] + ';';
        }
        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'actions.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-actions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(action in $scope.actions) {
        var json_element = {};

        json_element['Name'] = $scope.actions[action]['name'];

        for(criterion in $scope.criteria)
          json_element[$scope.criteria[criterion]['name']] = $scope.actions[action][$scope.criteria[criterion]['name']];

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'actions.json';
      hidden_element.click();
    }
  }

  $scope.deleteExecution = function(execution) {
    $scope.deleteIdExecution = execution.execution_id;
  }

  $scope.confirmDeleteExecution = function(execution) {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          for(exec in response.data[proj].executions) {
            if(response.data[proj].executions.exec.execution_id == execution.execution_id) {
              response.data[proj].executions.splice(exec, 1);
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

  $scope.cancelDeleteExecution = function() {
    $scope.deleteIdExecution = '';
  }

  $scope.deleteAllExecutions = function() {
    $scope.deleteIdExecution = 'all';
  }

  $scope.confirmDeleteAllExecutions = function() {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id == proj_id) {
          response.data[proj].executions = [];
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

  $scope.cancelDeleteAllExecutions = function() {
    $scope.deleteIdExecution = '';
  }

  $scope.selectAllImport = function() {
    document.getElementById('import-criteria-check').checked = true;
    document.getElementById('import-actions-check').checked = true;
  }

  $scope.selectNoneImport = function() {
    document.getElementById('import-criteria-check').checked = false;
    document.getElementById('import-actions-check').checked = false;
  }

  $scope.selectAllExport = function() {
    document.getElementById('export-criteria-check').checked = true;
    document.getElementById('export-actions-check').checked = true;
  }

  $scope.selectNoneExport = function() {
    document.getElementById('export-criteria-check').checked = false;
    document.getElementById('export-actions-check').checked = false;
  }

  $scope.showExecution = function(execution) {
    $scope.currentExecution = execution;
    $scope.compareExecution = '';
  }

  $scope.showCompareExecution = function(execution) {
    $scope.compareExecution = execution;
  }

  requestLogIn();
  rewriteLastUpdate();
});
