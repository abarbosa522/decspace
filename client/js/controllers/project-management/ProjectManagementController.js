app.controller('ProjectManagementController', function($scope, $window, $http, SortDataService) {
  //order that projects should be retrieved from db
  var currentOrder = ['', ''];

  $scope.methods = ['CAT-SD', 'Delphi', 'OrderBy', 'Sort', 'SRF'];

  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(res.data.user == undefined)
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

  //open project
  $scope.openProject = function(project) {
    switch(project.method) {
      case 'CAT-SD':
        $window.location.href = 'cat-sd.html?id=' + project['project_id'];
        break;
      case 'Delphi':
        $window.location.href = 'delphi.html?id=' + project['project_id'];
        break;
      case 'OrderBy':
        $window.location.href = 'order-by-method.html?id=' + project['project_id'];
        break;
      case 'Sort':
        $window.location.href = 'sort.html?id=' + project['project_id'];
        break;
      case 'SRF':
        $window.location.href = 'srf.html?id=' + project['project_id'];
        break;
    }
  }

  $scope.project = {};

  //add a new project
  $scope.addProject = function() {
    var can_add_project = true;

    if($scope.project.name == undefined || $scope.project.name == '') {
      $('#new-project-name').addClass('has-error');
      can_add_project = false;
    }
    else
      $('#new-project-name').removeClass('has-error');

    if($scope.project.method == undefined || $scope.project.method == '') {
      $('#new-project-method').addClass('has-error');
      can_add_project = false;
    }
    else
      $('#new-project-method').removeClass('has-error');

    if(can_add_project) {
      //get all projects from the database
      $http.get('/projects').then(function(response) {
        //get current date
        var current_date = new Date();
        var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

        //get the biggest project_id of the logged user
        var project_id = 0;

        for(project in response.data) {
          if(response.data[project]['username'] == $scope.username && response.data[project]['project_id'] > project_id)
            project_id = response.data[project]['project_id'];
        }
        project_id++;

        //create the new project
        var new_proj = {};
        new_proj.project_id = project_id;
        new_proj.username = $scope.username;
        new_proj.name = $scope.project.name;
        new_proj.method = $scope.project.method;
        new_proj.creation_date = creation_date;
        new_proj.last_update = creation_date;
        new_proj.executions = [];

        //add the new project to the database
        $http.post('/projects', new_proj).then(function() {
          //refresh the list of projects
          getProjects();
          //reset the input fields
          $scope.project.name = '';
          $scope.project.method = '';
        });
      });
    }
  }

  //duplicate a project
  $scope.duplicateProject = function(project) {
    //get all projects from the database
    $http.get('/projects').then(function(response) {
      //get current date
      var current_date = new Date();
      var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the biggest project_id of the logged user
      var project_id = 0;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].project_id > project_id)
          project_id = response.data[proj].project_id;
      }
      project_id++;

      //define the copy number
      var copy_number = 0;

      for(proj in response.data)
        if(response.data[proj].name == project.name)
          copy_number++;

      //create the new project
      var new_proj = angular.copy(project);
      delete new_proj['_id'];
      new_proj.project_id = project_id;
      new_proj.creation_date = creation_date;
      new_proj.last_update = creation_date;
      new_proj.copy_number = copy_number;

      //add the new list of projects
      $http.post('/projects', new_proj).then(function() {
        //refresh the list of projects
        getProjects();
      });
    });
  }

  $scope.delete_id_project = '';

  //delete a certain project
  $scope.deleteProject = function(project) {
    $scope.delete_id_project = project.project_id;
  }

  $scope.confirmDelete = function(project) {
    $http.get('/projects').then(function(response) {
      var id_doc;

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == project['project_id']) {
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          break;
        }
      }

      $http.delete('/projects/' + id_doc).then(function() {
        //refresh the list of projects
        getProjects();

        $scope.delete_id_project = '';
      });
    });
  }

  $scope.cancelDelete = function() {
    $scope.delete_id_project = '';
  }

  function getProjects() {
    $http.get('/projects').then(function(response) {
      var user_projects = [];

      //get the created projects by the logged user
      for(project in response.data) {
        if(response.data[project].username == $scope.username && response.data[project].method != undefined) {
          user_projects.push(response.data[project]);
        }
      }

      $scope.projects = user_projects;

      //sort projects
      sortProjects();
    });
  }

  $scope.changeCurrentOrder = function(attr, dir) {
    currentOrder = [attr, dir];
    sortProjects();
  }

  function sortProjects() {
    if(currentOrder[0] != '' && currentOrder[1] != '') {
      if(currentOrder[0] == 'creation_date' || currentOrder[0] == 'last_update')
        $scope.projects = SortDataService.sortDataDates($scope.projects, currentOrder[0], currentOrder[1]);
      else
        $scope.projects = SortDataService.sortDataVar($scope.projects, currentOrder[0], currentOrder[1]);
    }
  }

  $scope.confirmDeleteAll = function() {
    $http.get('/projects').then(function(response) {
      var id_doc;

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].method != undefined) {
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          $http.delete('/projects/' + id_doc);
        }
      }

      //refresh the list of projects
      getProjects();

      $scope.delete_id_project = '';
    });
  }

  /*** PROJECT VIEWS ***/

  $scope.current_view = 'table';

  $scope.changeView = function(view) {
    $scope.current_view = view;
  }

  /*** LIST VIEW ***/

  $scope.current_list = '';

  $scope.openList = function(list) {
    if($scope.current_list == list)
      $scope.current_list = '';
    else {
      $scope.current_list = list;

      if(list == 'creation_date' || list == 'last_update')
        $scope.projects = SortDataService.sortDataDates($scope.projects, list, 'ascendant');
      else
        $scope.projects = SortDataService.sortDataVar($scope.projects, list, 'ascendant');
    }

    $scope.method_list = '';
    $scope.delete_id_project = '';
  }

  $scope.method_list = '';

  $scope.openMethodList = function(list) {
    if($scope.method_list == list)
      $scope.method_list = '';
    else
      $scope.method_list = list;

    $scope.projects = SortDataService.sortDataVar($scope.projects, 'name', 'ascendant');
  }

  requestLogIn();
  getProjects();
});
