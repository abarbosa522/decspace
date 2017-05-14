app.controller('ProjectManagementController', function($scope, $window, $http) {
  //order that projects should be retrieved from db
  var currentOrder = ['', ''];

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
      getProjects();
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
        var proj_text = '{"project_id":' + project_id + ',"username":"' + $scope.username + '","name":"' + $scope.project.name + '","method":"' + $scope.project.method + '","creation_date":"' + creation_date + '","last_update":"' + creation_date + '","executions":[]}';

        //transform to json
        var proj_obj = JSON.parse(proj_text);

        //add the new project to the database
        $http.post('/projects', proj_obj).then(function() {
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

      //create the new project
      var new_proj = angular.copy(project);
      delete new_proj['_id'];
      new_proj.project_id = project_id;
      new_proj.name += ' - Copy';
      new_proj.creation_date = creation_date;
      new_proj.last_update = creation_date;

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
        if(response.data[project].username == $scope.username) {
          user_projects.push(response.data[project]);
        }
      }

      $scope.projects = user_projects;

      //sort projects
      if(currentOrder[0] != '' && currentOrder[1] != '') {
        $scope.projects.sort(sortData(currentOrder[0], currentOrder[1]));
      }

      //show/hide the "delete all projects" button
      if($scope.projects.length == 0)
        $scope.showDeleteAll = false;
      else
        $scope.showDeleteAll = true;
    });
  }

  $scope.changeCurrentOrder = function(attr, dir) {
    currentOrder = [attr, dir];
    getProjects();
  }

  function sortData(order, direction) {
    return function(a, b) {
      if(direction == 'ascendant') {
        if(a[order] < b[order])
          return -1;
        if(a[order] > b[order])
          return 1;
        return 0;
      }
      else {
        if(a[order] < b[order])
          return 1;
        if(a[order] > b[order])
          return -1;
        return 0;
      }
    }
  }

  $scope.deleteAllProjects = function() {
    $scope.delete_id_project = 'all';
  }

  $scope.confirmDeleteAll = function() {
    $http.get('/projects').then(function(response) {
      var id_doc;

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username) {
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

  $scope.cancelDeleteAll = function() {
    $scope.delete_id_project = '';
  }

  requestLogIn();
});
