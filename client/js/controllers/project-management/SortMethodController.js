app.controller('SortMethodController', function($scope, $http, $window) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  //draggable objects
  $scope.draggableObjects = [];

  $scope.deleteIdExecution = '';

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

  $scope.onDropComplete = function (index, obj, evt) {
    var otherObj = $scope.draggableObjects[index];
    var otherIndex = $scope.draggableObjects.indexOf(obj);
    $scope.draggableObjects[index] = obj;
    $scope.draggableObjects[otherIndex] = otherObj;
  }

  $scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {

          //insert sorted objects
          response[proj]['sorted_objects'] = $scope.draggableObjects;

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
          //get criteria
          if(typeof response[proj]['sorted_objects'] != 'undefined')
            $scope.draggableObjects = response[proj]['sorted_objects'];
          else {
            $scope.draggableObjects = [
              {name : 'Object 1'},
              {name : 'Object 2'},
              {name : 'Object 3'}
            ];
          }
        }
      }
    });
  }

  $scope.getResults = function() {
    //show loading button
    $scope.isLoading = true;

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
          response[proj]['executions'].push({'execution_id':execution_id,'results':$scope.draggableObjects,'comment':comment,'execution_date':execution_date});
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
          $scope.draggableObjects = response[proj]['sorted_objects'];
          break;
        }
      }
    });
  }

  $scope.resetData = function() {
    $scope.draggableObjects = [
      {name : 'Object 1'},
      {name : 'Object 2'},
      {name : 'Object 3'}
    ];
  }

  requestLogIn();
  rewriteLastUpdate();
});
