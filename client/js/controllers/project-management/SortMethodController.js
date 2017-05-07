app.controller('SortMethodController', function($scope, $http, $window) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  $scope.deleteIdExecution = '';

  $scope.showResetData = false;

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

  $scope.objects = [];
  $scope.deleteIdObject = '';
  $scope.objects_eye = 1;
  $scope.new_object = {};

  $scope.addObject = function() {
    console.log($scope.objects)
    //if a name has not been assigned - add error class
    if($scope.new_object.name == undefined || $scope.new_object.name == '')
      $('#objects-name').addClass('has-error');
    else {
      $('#objects-name').removeClass('has-error');

      if($scope.objects.length == 0)
        $scope.new_object.id = 1;
      else
        $scope.new_object.id = $scope.objects[$scope.objects.length - 1]['id'] + 1;

      $scope.objects.push(angular.copy($scope.new_object));

      //reset the new object input field and remove the error class - just in case
      $scope.new_object.name = '';
      $('#objects-name').removeClass('has-error');
    }
  }

  $scope.deleteObject = function(object) {
    $scope.deleteIdObject = object.id;
  }

  $scope.confirmDeleteObject = function(object) {
    $scope.objects.splice($scope.objects.indexOf(object), 1);
    $scope.deleteIdObject = '';
  }

  $scope.cancelDeleteObject = function() {
    $scope.deleteIdObject = '';
  }

  $scope.order_eye = 1;

  $scope.onDropComplete = function (index, obj, evt) {
    var otherObj = $scope.objects[index];
    var otherIndex = $scope.objects.indexOf(obj);
    $scope.objects[index] = obj;
    $scope.objects[otherIndex] = otherObj;
  }

  $scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {

          //insert objects
          response[proj]['objects'] = $scope.objects;

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

  $scope.changeSaveSuccess = function() {
    $scope.showSaveSuccess = false;
  }

  function getData() {
    $http.get('/projects').success(function(response) {
      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get objects
          if(response[proj]['objects'] != undefined)
            $scope.objects = response[proj]['objects'];
        }
      }
    });
  }

  $scope.objects_exec_eye = 1;
  $scope.order_exec_eye = 1;
  $scope.results_exec_eye = 1;

  $scope.getResults = function() {
    //show loading button
    $scope.isLoading = true;

    $http.get('/projects').success(function(response) {
      //get current date
      var current_date = new Date();
      var execution_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear() + ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

      //if a comment has not been added
      if(typeof $scope.new_execution == 'undefined')
        var comment = '';
      else
        var comment = $scope.new_execution.comment;

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the largest execution_id
          if(response[proj]['executions'].length == 0)
            var execution_id = 1;
          else
            var execution_id = response[proj]['executions'][response[proj]['executions'].length - 1]['execution_id'] + 1;

          //insert execution into database
          var new_exec = {};
          new_exec['execution_id'] = execution_id;
          new_exec['objects'] = $scope.objects;
          new_exec['comment'] = comment;
          new_exec['execution_date'] = execution_date;

          response[proj]['executions'].push(new_exec);

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

  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          if(response[proj]['sorted_objects'] != undefined)
            $scope.draggableObjects = response[proj]['sorted_objects'];
          break;
        }
      }
    });
  }

  $scope.resetData = function() {
    $scope.showResetData = true;
  }

  $scope.confirmResetData = function() {
    $scope.draggableObjects = [
      {'name' : 'Object 1'},
      {'name' : 'Object 2'},
      {'name' : 'Object 3'}
    ];

    $scope.showResetData = false;
  }

  $scope.cancelResetData = function() {
    $scope.showResetData = false;
  }

  $scope.importData = function() {
    var file_input = document.getElementById("import-file");

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
          $scope.$apply(function () {
            $scope.draggableObjects = data;
          });
      };
    }
    //imported file is a json file
    else if(file_extension == 'json') {
      return function(e) {
        var rows = e.target.result.split("\n");

        var data = [];
        for(row in rows)
          data.push(JSON.parse(rows[row]));

        $scope.$apply(function () {
          $scope.draggableObjects = data;
        });
      }
    }
  })(file_input.files[0]);

    //get the data from the file
    reader.readAsText(file_input.files[0]);
  }

  $scope.exportData = function() {
    if(angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(drag in $scope.draggableObjects) {
        for(field in $scope.draggableObjects[drag])
          if(field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(drag in $scope.draggableObjects) {
        for(field in $scope.draggableObjects[drag])
          if(field != '$$hashKey')
            csv_str += $scope.draggableObjects[drag][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'data.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(drag in $scope.draggableObjects) {
        var json_element = {};

        for(field in $scope.draggableObjects[drag])
          if(field != '$$hashKey')
            json_element[field] = $scope.draggableObjects[drag][field];

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'data.json';
      hidden_element.click();
    }
  }

  $scope.currentExecution = '';
  $scope.compareExecution = '';

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
