app.controller('OrderByMethodController', function($scope, $window, $http, OrderByService) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  //keep the value of the selectedCriterion
  var selectedCriterion = '';

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
          getCriteria();
          getSelectedCriterion();
          getActions();
          getExecutions();
        });
      });
    });
  }

  function getCriteria() {
    $http.get('/projects').success(function(response) {
      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          $scope.criteria = response[proj]['criteria'];
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

      if(!$scope.showCriterionNameError) {
        $http.get('/projects').success(function(response) {
          var id_doc, proj_res;

          for(proj in response) {
            if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
              //get the largest criteria_id
              if(response[proj]['criteria'].length == 0) {
                $scope.new_criterion.criterion_id = 1;
              }
              else {
                $scope.new_criterion.criterion_id = response[proj]['criteria'][response[proj]['criteria'].length - 1]['criterion_id'] + 1;
              }

              //insert criterion into the project
              response[proj]['criteria'].push($scope.new_criterion);
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
              //refresh the list of projects
              getCriteria();
              //reset the input fields
              $scope.new_criterion.name = '';
              $scope.new_criterion.type = '';
              $scope.new_criterion.direction = '';
            });
          });
        });
      }
    }
  }

  //edit a certain criterion
  $scope.editCriterion = function(criterion) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#criterion-list-' + criterion.criterion_id)).addClass('no-display');
    angular.element(document.querySelector('#criterion-edit-' + criterion.criterion_id)).removeClass('no-display');

    //disable all other edit, remove and add buttons
    angular.element(document.querySelectorAll('.btn-crt-edit, .btn-crt-remove, .btn-crt-add')).prop('disabled', true);
  }

  //confirm edit changes
  $scope.confirmEditCriterion = function(criterion) {
    //don't allow any of the fields to be empty - name, type and direction
    if(getNumberOfFields(criterion) < 3 || criterion.name == '' || criterion.type == '' || criterion.direction == '') {
      $scope.showCriterionFieldsError = true;
      $scope.showCriterionNameError = false;
    }
    //check if any there is another criterion with the same name - do not allow that
    else {
      $scope.showCriterionFieldsError = false;
      $scope.showCriterionNameError = false;

      for(crt in $scope.criteria) {
        if(criterion.name == $scope.criteria[crt]['name'] && criterion.criterion_id != $scope.criteria[crt]['criterion_id']) {
          $scope.showCriterionNameError = true;
          break;
        }
      }

      if(!$scope.showCriterionNameError) {
        //get all projects from the database
        $http.get('/projects').success(function(response) {
          var id_doc, proj_res;

          for(proj in response) {
            if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
              for(crt in response[proj]['criteria']) {
                if(response[proj]['criteria'][crt]['criterion_id'] == criterion.criterion_id) {
                  //change the edited fields
                  response[proj]['criteria'][crt] = criterion;

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
              //refresh the list of projects and the initial view
              getCriteria();
              //enable the add button again
              angular.element(document.querySelectorAll('.btn-crt-add')).prop('disabled', false);
            });
          });
        });
      }
    }
  }

  //cancel edit changes
  $scope.cancelEditCriterion = function() {
    //refresh the list of projects and the initial view
    getCriteria();
    //enable the add button again
    angular.element(document.querySelectorAll('.btn-crt-add')).prop('disabled', false);
  }

  //delete a certain criterion
  $scope.deleteCriterion = function(criterion) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#criterion-list-' + criterion.criterion_id)).addClass('no-display');
    angular.element(document.querySelector('#criterion-delete-' + criterion.criterion_id)).removeClass('no-display');

    //disable all other edit, remove and add buttons
    angular.element(document.querySelectorAll('.btn-crt-edit, .btn-crt-remove, .btn-crt-add')).prop('disabled', true);
  }

  $scope.confirmDeleteCriterion = function(criterion) {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          for(crt in response[proj]['criteria']) {
            if(response[proj]['criteria'][crt]['criterion_id'] == criterion.criterion_id) {
              //search for criterion and delete it from the database
              response[proj]['criteria'].splice(crt, 1);

              //if it is the selected criterion, then rewrite it
              if(selectedCriterion == criterion.name)
                response[proj]['order_by_criterion'] = '';

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
          getCriteria();
          //enable the add button again
          angular.element(document.querySelectorAll('.btn-crt-add')).prop('disabled', false);
        });
      });
    });
  }

  //cancel delete changes
  $scope.cancelDeleteCriterion = function() {
    //refresh the list of projects and the initial view
    getCriteria();
    //enable the add button again
    angular.element(document.querySelectorAll('.btn-crt-add')).prop('disabled', false);
  }

  function getSelectedCriterion() {
    $http.get('/projects').success(function(response) {
      //projects of the logged user
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the selected criterion
          selectedCriterion = response[proj]['order_by_criterion'];
        }
      }
    });
  }

  $scope.selectCriterion = function(criterion) {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;
      //projects of the logged user
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //insert or "rewrite" selected criterion in db
          response[proj]['order_by_criterion'] = criterion.name;

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
          selectedCriterion = criterion.name;
        });
      });
    });
  }

  $scope.isCriterionSelected = function(criterion) {
    if(selectedCriterion == criterion.name)
      return true;
    else
      return false;
  }

  function getActions() {
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the actions previously added
          $scope.actions = response[proj]['actions'];
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

      if(!$scope.showActionNameError) {
        $http.get('/projects').success(function(response) {
          var id_doc, proj_res;

          for(proj in response) {
            if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
              //define id of the action
              if(response[proj]['actions'].length == 0)
                $scope.new_action.action_id = 1;
              else
                $scope.new_action.action_id = response[proj]['actions'][response[proj]['actions'].length - 1]['action_id'] + 1;

              //insert action into database
              response[proj]['actions'].push($scope.new_action);
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
              //refresh the list of actions
              getActions();
              //reset the input fields
              $scope.new_action = ''
            });
          });
        });
      }
    }
  }

  //edit a certain action
  $scope.editAction = function(action) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#action-list-' + action.action_id)).addClass('no-display');
    angular.element(document.querySelector('#action-edit-' + action.action_id)).removeClass('no-display');

    //disable all other edit, remove and add buttons
    angular.element(document.querySelectorAll('.btn-action-edit, .btn-action-remove, .btn-action-add')).prop('disabled', true);
  }

  //confirm edit changes
  $scope.confirmEditAction = function(action) {
    //don't allow to insert an action with an empty field
    if(getNumberOfFields(action) <= $scope.criteria.length) {
      $scope.showActionFieldsError = true;
      $scope.showActionNameError = false;
    }
    //don't actions with the same name
    else {
      $scope.showActionFieldsError = false;
      $scope.showActionNameError = false;

      for(act in $scope.actions) {
        if(action.name == $scope.actions[act]['name'] && action.action_id != $scope.actions[act]['action_id']) {
          $scope.showActionNameError = true;
          break;
        }
      }

      if(!$scope.showActionNameError) {
        $http.get('/projects').success(function(response) {
          var id_doc, proj_res;

          for(proj in response) {
            if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
              for(act in response[proj]['actions']) {
                if(response[proj]['actions'][act]['action_id'] == action.action_id) {
                  response[proj]['actions'][act] = action;
                  //get the id of the document, so that it can be removed from the db
                  id_doc = response[proj]['_id'];
                  //project to store in the db
                  proj_res = response[proj];
                  delete proj_res['_id'];
                  break;
                }
              }
            }
          }

          //delete the previous document with the list of projects
          $http.delete('/projects/' + id_doc).success(function() {
            //add the new list of projects
            $http.post('/projects', proj_res).success(function() {
              //refresh the list of actions
              getActions();
              //enable the add button again
              angular.element(document.querySelectorAll('.btn-action-add')).prop('disabled', false);
            });
          });
        });
      }
    }
  }

  //cancel edit changes
  $scope.cancelEditAction = function(action) {
    //refresh the list of projects and the initial view
    getActions();
    //enable the add button again
    angular.element(document.querySelectorAll('.btn-action-add')).prop('disabled', false);
  }

  //delete a certain action
  $scope.deleteAction = function(action) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#action-list-' + action.action_id)).addClass('no-display');
    angular.element(document.querySelector('#action-delete-' + action.action_id)).removeClass('no-display');

    //disable all other edit, remove and add buttons
    angular.element(document.querySelectorAll('.btn-action-edit, .btn-action-remove, .btn-action-add')).prop('disabled', true);
  }

  $scope.confirmDeleteAction = function(action) {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          for(act in response[proj]['actions']) {
            if(response[proj]['actions'][act]['action_id'] == action.action_id) {
              //search for action and delete it from the database
              response[proj]['actions'].splice(act, 1);
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
          getActions();
          //enable the add button again
          angular.element(document.querySelectorAll('.btn-action-add')).prop('disabled', false);
        });
      });
    });
  }

  //cancel delete
  $scope.cancelDeleteAction = function(action) {
    //refresh the list of projects and the initial view
    getActions();
    //enable the add button again
    angular.element(document.querySelectorAll('.btn-action-add')).prop('disabled', false);
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
    //check if any criteria was added
    if($scope.criteria.length == 0) {
      $scope.showNoCriteriaError = true;
      $scope.showNoActionsError = false;
      $scope.showOrderError = false;
    }
    //check if any actions were added
    else if($scope.actions.length == 0) {
      $scope.showNoCriteriaError = false;
      $scope.showNoActionsError = true;
      $scope.showOrderError = false;
    }
    //check if a criterion was selected
    else if(selectedCriterion == '') {
      $scope.showNoCriteriaError = false;
      $scope.showNoActionsError = false;
      $scope.showOrderError = true;
    }
    else {
      $scope.showNoCriteriaError = false;
      $scope.showNoActionsError = false;
      $scope.showOrderError = false;

      var results = OrderByService.getResults($scope.criteria, $scope.actions, selectedCriterion);

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

            //insert action into database
            response[proj]['executions'].push({'execution_id':execution_id,'criteria':$scope.criteria,'actions':$scope.actions,'order_by_criterion':selectedCriterion,'results':results,'comment':comment,'execution_date':execution_date});
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
          });
        });
      });
    }
  }

  $scope.deleteExecution = function(execution) {
    //hide the listed execution and show the delete view
    angular.element(document.querySelector('#execution-list-' + execution.execution_id)).addClass('no-display');
    angular.element(document.querySelector('#execution-delete-' + execution.execution_id)).removeClass('no-display');

    //disable all other edit, remove and add buttons
    angular.element(document.querySelectorAll('.btn-execution-delete, #btn-delete-all, #btn-get-results')).prop('disabled', true);
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
          //enable the delete all and get results buttons again
          angular.element(document.querySelectorAll('#btn-delete-all, #btn-get-results')).prop('disabled', false);
        });
      });
    });
  }

  //cancel delete
  $scope.cancelDeleteExecution = function(execution) {
    //refresh the list of projects and the initial view
    getExecutions();
    //enable the delete all and get results buttons again
    angular.element(document.querySelectorAll('#btn-delete-all, #btn-get-results')).prop('disabled', false);
  }

  $scope.deleteAllExecutions = function() {
    //hide the list view and show the delete view of all executions
    for(execution in $scope.executions) {
      angular.element(document.querySelector('#execution-list-' + $scope.executions[execution].execution_id)).children().first().children().first().addClass('list-group-item-danger');
    }

    //disable the delete button of each execution
    angular.element(document.querySelectorAll('.btn-execution-delete')).prop('disabled', true);
    //hide the delete all button
    angular.element(document.querySelector('#btn-delete-all-div')).addClass('no-display');
    //show the confirm and cancel delete all executions
    angular.element(document.querySelector('#delete-all-btn-group')).removeClass('no-display');
    //disable get results button
    angular.element(document.querySelector('#btn-get-results')).prop('disabled', true);
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
          //show the delete all button
          angular.element(document.querySelector('#btn-delete-all-div')).removeClass('no-display');
          //hide the confirm and cancel delete all executions
          angular.element(document.querySelector('#delete-all-btn-group')).addClass('no-display');
          //enable get results button
          angular.element(document.querySelector('#btn-get-results')).prop('disabled', false);
        });
      });
    });
  }

  $scope.cancelDeleteAllExecutions = function() {
    //refresh the list of executions
    getExecutions();
    //show the delete all button
    angular.element(document.querySelector('#btn-delete-all-div')).removeClass('no-display');
    //hide the confirm and cancel delete all executions
    angular.element(document.querySelector('#delete-all-btn-group')).addClass('no-display');
    //enable get results button
    angular.element(document.querySelector('#btn-get-results')).prop('disabled', false);
  }

  requestLogIn();
  rewriteLastUpdate();
});
