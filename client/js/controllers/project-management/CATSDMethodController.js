app.controller('CATSDMethodController', function($scope, $window, $http, CATSDService) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  $scope.criteria = [];
  $scope.deleteIdCriterion = '';

  $scope.interaction_effects = [];
  $scope.deleteIdInteractionEffect = '';

  $scope.new_branch = [];
  $scope.deleteIdBranch = ['', ''];

  $scope.actions = [];
  $scope.deleteIdAction = '';

  $scope.categories = [];
  $scope.deleteIdCategory = '';

  $scope.new_reference_action = [];
  $scope.deleteIdReferenceAction = ['', ''];

  $scope.deleteIdExecution = '';

  $scope.isLoading = false;

  //eye icons variables
  $scope.criteria_eye = 1;
  $scope.interaction_effects_eye = 1;
  $scope.scales_functions_eye = 1;
  $scope.actions_eye = 1;
  $scope.categories_eye = 1;
  $scope.reference_actions_eye = 1;

  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      if(typeof res.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').success(function(response) {
          for(account in response) {
            if(response[account].email == $scope.username) {
              $scope.name = response[account].name;
              break;
            }
          }
        });
      }
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response[proj]['name'];
          //change the date of the last update of the project
          response[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          getData();
          getExecutions();
        });
      });
    });
  }

  $scope.addCriterion = function() {
    if($scope.criteria.length == 0)
      $scope.new_criterion.id = 1;
    else
      $scope.new_criterion.id = $scope.criteria[$scope.criteria.length - 1].id + 1;

    if(typeof $scope.new_criterion.direction == 'undefined')
      $scope.new_criterion.direction = '';

    $scope.new_criterion.branches = [];
    $scope.criteria.push(angular.copy($scope.new_criterion));

    //reset the input fields
    $scope.new_criterion.direction = '';
    $scope.new_criterion.name = '';
  }

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

  $scope.addInteractionEffect = function() {
    if($scope.interaction_effects.length == 0)
      $scope.new_interaction_effect.id = 1;
    else
      $scope.new_interaction_effect.id = $scope.interaction_effects[$scope.interaction_effects.length - 1].id + 1;

    if(typeof $scope.new_interaction_effect.type == 'undefined')
      $scope.new_interaction_effect.type = '';

    if(typeof $scope.new_interaction_effect.criterion1 == 'undefined')
      $scope.new_interaction_effect.criterion1 = '';

    if(typeof $scope.new_interaction_effect.criterion2 == 'undefined')
      $scope.new_interaction_effect.criterion2 = '';

    $scope.interaction_effects.push(angular.copy($scope.new_interaction_effect));

    //reset the input fields
    $scope.new_interaction_effect.type = '';
    $scope.new_interaction_effect.criterion1 = '';
    $scope.new_interaction_effect.criterion2 = '';
    $scope.new_interaction_effect.value = '';
  }

  $scope.deleteInteractionEffect = function(interaction) {
    $scope.deleteIdInteractionEffect = interaction.id;
  }

  $scope.confirmDeleteInteractionEffect = function(interaction) {
    $scope.interaction_effects.splice($scope.interaction_effects.indexOf(interaction), 1);
    $scope.deleteIdInteractionEffect = '';
  }

  $scope.cancelDeleteInteractionEffect = function() {
    $scope.deleteIdInteractionEffect = '';
  }

  $scope.addBranch = function(criterion) {
    if($scope.criteria[$scope.criteria.indexOf(criterion)].branches.length == 0)
      $scope.new_branch[criterion.id].id = 1;
    else
      $scope.new_branch[criterion.id].id = $scope.criteria[$scope.criteria.indexOf(criterion)].branches[$scope.criteria[$scope.criteria.indexOf(criterion)].branches.length - 1].id + 1;

    $scope.criteria[$scope.criteria.indexOf(criterion)].branches.push(angular.copy($scope.new_branch[criterion.id]));

    //reset input fields
    $scope.new_branch[criterion.id].function = '';
    $scope.new_branch[criterion.id].condition = '';
  }

  $scope.deleteBranch = function(criterion, branch) {
    $scope.deleteIdBranch[0] = criterion.id;
    $scope.deleteIdBranch[1] = branch.id;
  }

  $scope.confirmDeleteBranch = function(criterion, branch) {
    $scope.criteria[$scope.criteria.indexOf(criterion)].branches.splice($scope.criteria[$scope.criteria.indexOf(criterion)].branches.indexOf(branch), 1);
    $scope.deleteIdBranch = ['', ''];
  }

  $scope.cancelDeleteBranch = function() {
    $scope.deleteIdBranch = ['', ''];
  }

  $scope.addAction = function() {
    if($scope.actions.length == 0)
      $scope.new_action.id = 1;
    else
      $scope.new_action.id = $scope.actions[$scope.actions.length - 1].id + 1;

    $scope.actions.push(angular.copy($scope.new_action));

    //reset the input fields
    $scope.new_action.name = '';
    for(criterion in $scope.criteria)
      $scope.new_action[$scope.criteria[criterion]['name']] = '';
  }

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

  $scope.addCategory = function() {
    if($scope.categories.length == 0)
      $scope.new_category.id = 1;
    else
      $scope.new_category.id = $scope.categories[$scope.categories.length - 1].id + 1;

    $scope.new_category.reference_actions = [];
    $scope.categories.push(angular.copy($scope.new_category));

    //reset the input fields
    $scope.new_category.name = '';
    $scope.new_category.membership_degree = '';
    for(criterion in $scope.criteria)
      $scope.new_category[$scope.criteria[criterion]['name']] = '';
  }

  $scope.deleteCategory = function(category) {
    $scope.deleteIdCategory = category.id;
  }

  $scope.confirmDeleteCategory = function(category) {
    $scope.categories.splice($scope.categories.indexOf(category), 1);
    $scope.deleteIdCategory = '';
  }

  $scope.cancelDeleteCategory = function() {
    $scope.deleteIdCategory = '';
  }

  $scope.addReferenceAction = function(category, index) {
    if($scope.categories[$scope.categories.indexOf(category)].reference_actions.length == 0)
      $scope.new_reference_action[category.id].id = 1;
    else
      $scope.new_reference_action[category.id].id = $scope.categories[$scope.categories.indexOf(category)].reference_actions[$scope.categories[$scope.categories.indexOf(category)].reference_actions.length - 1].id + 1;

    $scope.new_reference_action[category.id].name = 'b' + (index + 1) + ($scope.categories[$scope.categories.indexOf(category)].reference_actions.length + 1);

    $scope.categories[$scope.categories.indexOf(category)].reference_actions.push(angular.copy($scope.new_reference_action[category.id]));

    //reset the input fields
    $scope.new_reference_action[category.id].name = '';
    for(criterion in $scope.criteria)
      $scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] = '';
  }

  $scope.deleteReferenceAction = function(category, reference_action) {
    $scope.deleteIdReferenceAction[0] = category.id;
    $scope.deleteIdReferenceAction[1] = reference_action.id;
  }

  $scope.confirmDeleteReferenceAction = function(category, ref) {
    $scope.categories[$scope.categories.indexOf(category)].reference_actions.splice($scope.categories[$scope.categories.indexOf(category)].reference_actions.indexOf(ref), 1);
    $scope.deleteIdReferenceAction = ['', ''];
  }

  $scope.cancelDeleteReferenceAction = function() {
    $scope.deleteIdReferenceAction = ['', ''];
  }

  $scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {

          //insert criteria
          response[proj]['criteria'] = $scope.criteria;
          //insert interaction effects
          response[proj]['interaction_effects'] = $scope.interaction_effects;
          //insert actions
          response[proj]['actions'] = $scope.actions;
          //insert categories
          response[proj]['categories'] = $scope.categories;

          //get the id of the document
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          $scope.showSaveSuccess = true;
        });
      });
    });
  }

  function getData() {
    $http.get('/projects').success(function(response) {
      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get criteria
          if(typeof response[proj]['criteria'] == 'undefined')
            $scope.criteria = [];
          else
            $scope.criteria = response[proj]['criteria'];

          //get interaction effects
          if(typeof response[proj]['interaction_effects'] == 'undefined')
            $scope.interaction_effects = [];
          else
            $scope.interaction_effects = response[proj]['interaction_effects'];

          //get actions
          if(typeof response[proj]['actions'] == 'undefined')
            $scope.actions = [];
          else
            $scope.actions = response[proj]['actions'];

          //get categories
          if(typeof response[proj]['categories'] == 'undefined')
            $scope.categories = [];
          else
            $scope.categories = response[proj]['categories'];
        }
      }
    });
  }

  function getExecutions() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the actions previously added
          $scope.executions = response[proj]['executions'];
          break;
        }
      }
    });
  }

  $scope.getResults = function() {
    //show loading button
    $scope.isLoading = true;

    var results = CATSDService.getResults($scope.criteria, $scope.interaction_effects, $scope.actions, $scope.categories);

    results.then(function(resolve) {
      console.log(resolve);

      $http.get('/projects').success(function(response) {
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

        for(proj in response) {
          if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
            //get the largest execution_id
            if(response[proj]['executions'].length == 0) {
              var execution_id = 1;
            }
            else {
              var execution_id = response[proj]['executions'][response[proj]['executions'].length - 1]['execution_id'] + 1;
            }

            //insert execution into database
            response[proj]['executions'].push({'execution_id':execution_id,'criteria':$scope.criteria,'actions':$scope.actions,'categories':$scope.categories,'interaction_effects':$scope.interaction_effects,'results':resolve,'comment':comment,'execution_date':execution_date});
            //get the id of the document, so that it can be removed from the db
            id_doc = response[proj]['_id'];
            //project to store in the db
            proj_res = response[proj];
            delete proj_res['_id'];
            break;
          }
        }

        //delete the previous document with the list of projects
        $http.delete('/projects/' + id_doc).success(function() {
          //add the new list of projects
          $http.post('/projects', proj_res).success(function() {
            getExecutions();

            //reset the comment input field, if it was filled
            if(typeof $scope.new_execution != 'undefined')
              $scope.new_execution.comment = '';

            //hide loading button
            $scope.isLoading = false;
          });
        });
      });
    });
  }

  $scope.deleteExecution = function(execution) {
    $scope.deleteIdExecution = execution.execution_id;
  }

  $scope.confirmDeleteExecution = function(execution) {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          for(exec in response[proj]['executions']) {
            if(response[proj]['executions'][exec]['execution_id'] == execution.execution_id) {
              response[proj]['executions'].splice(exec, 1);
              //get the id of the document, so that it can be removed from the db
              id_doc = response[proj]['_id'];
              //project to store in the db
              proj_res = response[proj];
              delete proj_res['_id'];
              break;
            }
          }
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
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
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          response[proj]['executions'] = [];
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
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

  $scope.changeSaveSuccess = function() {
    $scope.showSaveSuccess = false;
  }

  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          $scope.criteria = response[proj]['criteria'];
          $scope.interaction_effects = response[proj]['interaction_effects'];
          $scope.actions = response[proj]['actions'];
          $scope.categories = response[proj]['categories'];
          break;
        }
      }
    });
  }

  $scope.resetData = function() {
    $scope.criteria = [];
    $scope.interaction_effects = [];
    $scope.actions = [];
    $scope.categories = [];
  }

  $scope.importData = function() {
    if(angular.element(document.querySelector('#import-criteria-check')).prop('checked')) {
      importFile('import-criteria-file');
    }
    if(angular.element(document.querySelector('#import-interaction-effects-check')).prop('checked')) {
      importFile('import-interaction-effects-file');
    }
    if(angular.element(document.querySelector('#import-scales-check')).prop('checked')) {
      importFile('import-scales-file');
    }
    if(angular.element(document.querySelector('#import-functions-check')).prop('checked')) {
      importFile('import-functions-file');
    }
    if(angular.element(document.querySelector('#import-actions-check')).prop('checked')) {
      importFile('import-actions-file');
    }
    if(angular.element(document.querySelector('#import-categories-check')).prop('checked')) {
      importFile('import-categories-file');
    }
    if(angular.element(document.querySelector('#import-reference-actions-check')).prop('checked')) {
      importFile('import-reference-actions-file');
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

          for(var i = 1; i < rows.length; i++) {
            var cells = rows[i].split(";");
            var element = {};

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

          var data = [];
          for(row in rows)
            data.push(JSON.parse(rows[row]));

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

      case 'import-interaction-effects-file':
        for(item in data)
          data[item]['value'] = Number(data[item]['value']);

        $scope.interaction_effects = data;
        break;

      case 'import-scales-file':
        for(item in data) {
          for(criterion in $scope.criteria) {
            if(data[item]['criterion'] == $scope.criteria[criterion]['name']) {
              if(data[item]['type'] == 'Numerical') {
                $scope.criteria[criterion]['scale']['type'] = data[item]['type'];
                $scope.criteria[criterion]['scale']['min'] = Number(data[item]['min']);
                $scope.criteria[criterion]['scale']['max'] = Number(data[item]['max']);
              }
              else if(data[item]['type'] == 'Categorical') {
                $scope.criteria[criterion]['scale']['type'] = data[item]['type'];
                $scope.criteria[criterion]['scale']['num_categories'] = Number(data[item]['num_categories']);
              }
            }
          }
        }
        break;

      case 'import-functions-file':
        //variable to keep track of which criterion's branches have already been cleared
        var clear_array = [];
        for(item in data)
          clear_array[data[item]['criterion']] = false;

        for(item in data) {
          for(criterion in $scope.criteria) {
            if(data[item]['criterion'] == $scope.criteria[criterion]['name']) {
              if(!clear_array[data[item]['criterion']]) {
                $scope.criteria[criterion]['branches'] = [];
                clear_array[data[item]['criterion']] = true;
              }
              $scope.criteria[criterion]['branches'].push(data[item]);
            }
          }
        }
        break;

      case 'import-actions-file':
        for(action in data)
          for(field in data[action])
            if(field != 'name')
              data[action][field] = Number(data[action][field]);

        $scope.actions = data;
        break;

      case 'import-categories-file':
        for(category in data)
          for(field in data[category])
            if(field != 'name')
              data[category][field] = Number(data[category][field]);

        $scope.categories = data;
        break;

      case 'import-reference-actions-file':
        //variable to keep track of which categories' reference actions have already been cleared
        var clear_array = [];

        for(item in data)
          clear_array[data[item]['category']] = false;

        for(ref in data)
          for(field in data[ref])
            if(field != 'category')
              data[ref][field] = Number(data[ref][field]);

        for(item in data) {
          for(category in $scope.categories) {
            if(data[item]['category'] == $scope.categories[category]['name']) {
              if(!clear_array[data[item]['category']]) {
                $scope.categories[category]['reference_actions'] = [];
                clear_array[data[item]['category']] = true;
              }
              data[item]['name'] = 'b' + (Number(category) + 1) + ($scope.categories[category].reference_actions.length + 1);
              $scope.categories[category]['reference_actions'].push(data[item]);
            }
          }
        }
        break;
    }
  }

  $scope.exportData = function() {
    //export criteria to csv
    if(angular.element(document.querySelector('#export-criteria-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(criterion in $scope.criteria) {
        for(field in $scope.criteria[criterion])
          if(field != 'id' && field != 'branches' && field != 'scale' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(criterion in $scope.criteria) {
        for(field in $scope.criteria[criterion])
          if(field != 'id' && field != 'branches' && field != 'scale' && field != '$$hashKey')
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
          if(field != 'id' && field != 'branches' && field != 'scale' && field != '$$hashKey')
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
    if(angular.element(document.querySelector('#export-interaction-effects-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(inter in $scope.interaction_effects) {
        for(field in $scope.interaction_effects[inter])
          if(field != 'id' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(inter in $scope.interaction_effects) {
        for(field in $scope.interaction_effects[inter])
          if(field != 'id' && field != '$$hashKey')
            csv_str += $scope.interaction_effects[inter][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'interaction_effects.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-interaction-effects-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(inter in $scope.interaction_effects) {
        var json_element = {};
        for(field in $scope.interaction_effects[inter]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.interaction_effects[inter][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'interaction_effects.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-scales-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'criterion;type;min;max;num_categories\n';

      for(criterion in $scope.criteria) {
        csv_str += $scope.criteria[criterion]['name'] + ';';

        csv_str += $scope.criteria[criterion]['scale']['type'] + ';';

        if($scope.criteria[criterion]['scale']['min'] != undefined)
          csv_str += $scope.criteria[criterion]['scale']['min'] + ';';
        else
          csv_str += '-;';

        if($scope.criteria[criterion]['scale']['max'] != undefined)
          csv_str += $scope.criteria[criterion]['scale']['max'] + ';';
        else
          csv_str += '-;';

        if($scope.criteria[criterion]['scale']['num_categories'] != undefined)
          csv_str += $scope.criteria[criterion]['scale']['num_categories'];
        else
          csv_str += '-';

        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'scales.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-scales-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(criterion in $scope.criteria) {
        var json_element = {};

        json_element['criterion'] = $scope.criteria[criterion]['name'];

        json_element['type'] = $scope.criteria[criterion]['scale']['type'];

        if($scope.criteria[criterion]['scale']['min'] != undefined)
          json_element['min'] = $scope.criteria[criterion]['scale']['min'] + ';';
        else
          json_element['min'] = '-;';

        if($scope.criteria[criterion]['scale']['max'] != undefined)
          json_element['max'] = $scope.criteria[criterion]['scale']['max'] + ';';
        else
          json_element['max'] = '-;';

        if($scope.criteria[criterion]['scale']['num_categories'] != undefined)
          json_element['num_categories'] = $scope.criteria[criterion]['scale']['num_categories'] + '';
        else
          json_element['num_categories'] = '-';

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'scales.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-functions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'criterion;function;condition\n';

      for(criterion in $scope.criteria) {
        for(branch in $scope.criteria[criterion]['branches']) {
          csv_str += $scope.criteria[criterion]['name'] + ';';
          csv_str += $scope.criteria[criterion]['branches'][branch]['function'] + ';';
          csv_str += $scope.criteria[criterion]['branches'][branch]['condition'];

          csv_str += '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'functions.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-functions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(criterion in $scope.criteria) {
        for(branch in $scope.criteria[criterion]['branches']) {
          var json_element = {};

          json_element['criterion'] = $scope.criteria[criterion]['name'];

          json_element['function'] = $scope.criteria[criterion]['branches'][branch]['function'];

          json_element['condition'] = $scope.criteria[criterion]['branches'][branch]['condition'];

          json_str += JSON.stringify(json_element) + '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'functions.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-actions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(action in $scope.actions) {
        for(field in $scope.actions[action])
          if(field != 'id' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(action in $scope.actions) {
        for(field in $scope.actions[action])
          if(field != 'id' && field != '$$hashKey')
            csv_str += $scope.actions[action][field] + ';';

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

        for(field in $scope.actions[action]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.actions[action][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'actions.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-categories-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(category in $scope.categories) {
        for(field in $scope.categories[category])
          if(field != 'id' && field != '$$hashKey' && field != 'reference_actions')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(category in $scope.categories) {
        for(field in $scope.categories[category])
          if(field != 'id' && field != '$$hashKey' && field != 'reference_actions')
            csv_str += $scope.categories[category][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'categories.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-categories-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(category in $scope.categories) {
        var json_element = {};

        for(field in $scope.categories[category]) {
          if(field != 'id' && field != '$$hashKey' && field != 'reference_actions')
            json_element[field] = $scope.categories[category][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'categories.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-reference-actions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'category;';

      for(category in $scope.categories) {
        for(ref in $scope.categories[category]['reference_actions']) {
          for(field in $scope.categories[category]['reference_actions'][ref]) {
            if(field != 'id' && field != '$$hashKey' && field != 'name')
              csv_str += field + ';';
          }
          csv_str = csv_str.substring(0, csv_str.length - 1);
          csv_str += '\n';
          break;
        }
        break;
      }

      for(category in $scope.categories) {
        for(ref in $scope.categories[category]['reference_actions']) {
          csv_str += $scope.categories[category]['name'] + ';';
          for(field in $scope.categories[category]['reference_actions'][ref])
            if(field != 'id' && field != '$$hashKey' && field != 'name')
              csv_str += $scope.categories[category]['reference_actions'][ref][field] + ';';

          csv_str = csv_str.substring(0, csv_str.length - 1);
          csv_str += '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'reference_actions.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-reference-actions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(category in $scope.categories) {
        var json_element = {};
        for(ref in $scope.categories[category]['reference_actions']) {
          json_element['category'] = $scope.categories[category]['name'];
          for(field in $scope.categories[category]['reference_actions'][ref]) {
            if(field != 'id' && field != '$$hashKey' && field != 'name')
              json_element[field] = $scope.categories[category]['reference_actions'][ref][field];
          }

          json_str += JSON.stringify(json_element) + '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'reference_actions.json';
      hidden_element.click();
    }
  }

  requestLogIn();
  rewriteLastUpdate();
});
