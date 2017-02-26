app.controller('ProjectManagementController', function($scope, $window, $http) {
  //order that projects should be retrieved from db
  var currentOrder;

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

  //favorite a project, so that it shows on the top of the list of all projects
  $scope.starProject = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == project['project_id']) {
          //change the starred state to true
          response[proj]['starred'] = 'true';
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
          getProjects();
        });
      });
    });
  }

  //unfavorite a project, so that it appears on the bottom
  $scope.unstarProject = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == project['project_id']) {
          //change the starred state to false
          response[proj]['starred'] = 'false';
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
          getProjects();
        });
      });
    });
  }

  //open project
  $scope.openProject = function(project) {
    switch(project.method) {
      case 'OrderBy':
        $window.location.href = 'order-by-method.html?id=' + project['project_id'];
        break;
    }
  }

  //add a new project
  $scope.addProject = function() {
    //if a method has not chosen
    if(typeof $scope.project.method == 'undefined' || $scope.project.method == '') {
      //show method alert and don't add the project
      $scope.showMethodErrorAlert = true;
      //hide the name error alert
      $scope.showNameErrorAlert = false;
    }
    else if(typeof $scope.project.name == 'undefined' || $scope.project.name == '') {
      //show name alert and don't add the project
      $scope.showNameErrorAlert = true;
      //hide the method error alert
      $scope.showMethodErrorAlert = false;
    }
    else {
      //hide alerts, in case they were showing before
      $scope.showMethodErrorAlert = false;
      $scope.showNameErrorAlert = false;

      //get all projects from the database
      $http.get('/projects').success(function(response) {
        //get current date
        var current_date = new Date();
        var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

        //get the biggest project_id of the logged user
        var project_id = 0;

        for(project in response) {
          if(response[project]['username'] == $scope.username && response[project]['project_id'] > project_id)
            project_id = response[project]['project_id'];
        }
        project_id++;

        //create the new project
        var proj_text = '{"project_id":"' + project_id + '","username":"' + $scope.username + '","name":"' + $scope.project.name + '","method":"' + $scope.project.method + '","starred":"false","creation_date":"' + creation_date + '","last_update":"' + creation_date + '","criteria":[],"order_by_criterion":"","actions":[],"executions":[]}';

        //transform to json
        var proj_obj = JSON.parse(proj_text);

        //add the new project to the database
        $http.post('/projects', proj_obj).success(function() {
          //refresh the list of projects
          getProjects();
          //reset the input fields
          $scope.project.name = '';
          $scope.project.method = '';
        });
      });
    }
  }

  //edit the name of a certain project
  $scope.editProject = function(project) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#proj-list-' + project['project_id'])).addClass('no-display');
    angular.element(document.querySelector('#proj-edit-' + project['project_id'])).removeClass('no-display');

    //disable all other open, edit, duplicate or delete buttons
    angular.element(document.querySelectorAll('.btn-open, .btn-edit, .btn-duplicate, .btn-delete, .btn-star-empty, .btn-star, .btn-add, .btn-delete-all')).prop('disabled', true);
  }

  //confirm edit changes
  $scope.confirmEdit = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == project['project_id']) {

          //change the name of the project
          response[proj]['name'] = project.name;
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
          getProjects();
          //enable the add button
          angular.element(document.querySelectorAll('.btn-add, .btn-delete-all')).prop('disabled', false);
        });
      });
    });
  }

  //cancel edit changes
  $scope.cancelEdit = function() {
    getProjects();
    //enable the add button
    angular.element(document.querySelectorAll('.btn-add, .btn-delete-all')).prop('disabled', false);
  }

  //duplicate a project
  $scope.duplicateProject = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(response) {
      //get current date
      var current_date = new Date();
      var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the biggest project_id of the logged user
      var project_id = 0;

      for(proj in response) {
        if(response[proj]['username'] == $scope.username && response[proj]['project_id'] > project_id)
          project_id = response[proj]['project_id'];
      }
      project_id++;

      //create the new project
      var proj_text = '{"project_id":"' + project_id + '","username":"' + $scope.username + '","name":"' + project.name + ' - Copy' + '","method":"' + project.method + '","starred":"' + project.starred + '","creation_date":"' + creation_date + '","last_update":"' + creation_date + '","criteria":' + JSON.stringify(project.criteria) +
      ',"order_by_criterion":"' + project.order_by_criterion + '","actions":' + JSON.stringify(project.actions) + ',"executions":' + JSON.stringify(project.executions) + '}';

      //transform to json
      var proj_obj = JSON.parse(proj_text);

      //add the new list of projects
      $http.post('/projects', proj_obj).success(function() {
        //refresh the list of projects
        getProjects();
      });
    });
  }

  //delete a certain project
  $scope.deleteProject = function(project) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#proj-list-' + project['project_id'])).addClass('no-display');
    angular.element(document.querySelector('#proj-delete-' + project['project_id'])).removeClass('no-display');

    //disable all other open, edit, duplicate or delete buttons
    angular.element(document.querySelectorAll('.btn-open, .btn-edit, .btn-duplicate, .btn-delete, .btn-star-empty, .btn-star, .btn-add, .btn-delete-all')).prop('disabled', true);
  }

  $scope.confirmDelete = function(project) {
    $http.get('/projects').success(function(response) {
      var id_doc;

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == project['project_id']) {
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          break;
        }
      }

      $http.delete('/projects/' + id_doc).success(function() {
        //refresh the list of projects
        getProjects();
        //enable the add button
        angular.element(document.querySelectorAll('.btn-add, .btn-delete-all')).prop('disabled', false);
      });
    });
  }

  $scope.cancelDelete = function() {
    getProjects();
    //enable the add button
    angular.element(document.querySelectorAll('.btn-add, .btn-delete-all')).prop('disabled', false);
  }

  function getProjects() {
    $http.get(currentOrder).success(function(response) {
      var starred_projects = [], unstarred_projects = [];

      //get the created projects by the logged user
      for(project in response) {
        if(response[project].username == $scope.username) {
          if(response[project]['starred'] == 'true') {
            starred_projects.push(response[project]);
          }
          else {
            unstarred_projects.push(response[project]);
          }
        }
      }

      //put starred_projects first
      $scope.projects = starred_projects;
      for(project in unstarred_projects)
        $scope.projects.push(unstarred_projects[project]);

      //show/hide the "delete all projects" button
      if($scope.projects.length == 0)
        $scope.showDeleteAll = false;
      else
        $scope.showDeleteAll = true;
    });
  }

  function changeCurrentOrder(attr, order) {
    currentOrder = '/projects-' + attr + '-' + order;

    getProjects();
  }

  $scope.deleteAllProjects = function() {
    angular.element(document.querySelector('#delete-projects-list')).addClass('no-display');
    angular.element(document.querySelector('#delete-projects-confirm')).removeClass('no-display');
    //disable all other open, edit, duplicate or delete buttons
    angular.element(document.querySelectorAll('.btn-open, .btn-edit, .btn-duplicate, .btn-delete, .btn-star-empty, .btn-star, .btn-add')).prop('disabled', true);

    for(project in $scope.projects) {
      angular.element(document.querySelector('#proj-list-' + $scope.projects[project].project_id)).addClass('danger');
    }
  }

  $scope.confirmDeleteAll = function() {
    $http.get('/projects').success(function(response) {
      var id_doc;

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username) {
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          $http.delete('/projects/' + id_doc);
        }
      }

      //refresh the list of projects
      getProjects();
      //hide the listed project and show the edit view
      angular.element(document.querySelector('#delete-projects-confirm')).addClass('no-display');
      angular.element(document.querySelector('#delete-projects-list')).removeClass('no-display');
      //enable the add button
      angular.element(document.querySelectorAll('.btn-add')).prop('disabled', false);
    });
  }

  $scope.cancelDeleteAll = function() {
    //refresh the list of projects
    getProjects();
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#delete-projects-confirm')).addClass('no-display');
    angular.element(document.querySelector('#delete-projects-list')).removeClass('no-display');
    //enable the add button
    angular.element(document.querySelectorAll('.btn-add')).prop('disabled', false);
  }

  requestLogIn();
  changeCurrentOrder('id', 'ascendant');

});
