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
        $scope.projects.sort(sortDates(currentOrder[0], currentOrder[1]));
      else
        $scope.projects.sort(sortData(currentOrder[0], currentOrder[1]));
    }
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

  //sort dates by "order" and "direction"
  function sortDates(order, direction) {
    return function(a, b) {
      //parse the first date
      var date1 = new Date();
      var day = a[order].substr(0, a[order].indexOf('-'));
      var month = a[order].substr(a[order].indexOf('-') + 1);
      month = month.substr(0, month.indexOf('-'));
      var year = a[order].substr(a[order].lastIndexOf('-') + 1, a[order].length - 1);
      date1.setFullYear(year, Number(month) - 1, day);

      //parse the second date
      var date2 = new Date();
      day = b[order].substr(0, b[order].indexOf('-'));
      month = b[order].substr(b[order].indexOf('-') + 1);
      month = month.substr(0, month.indexOf('-'));
      year = b[order].substr(b[order].lastIndexOf('-') + 1, b[order].length - 1);
      date2.setFullYear(year, Number(month) - 1, day);

      if(direction == 'ascendant') {
        if(date1 < date2)
          return -1;
        if(date1 > date2)
          return 1;
        return 0;
      }
      else {
        if(date1 < date2)
          return 1;
        if(date1 > date2)
          return -1;
        return 0;
      }
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

  requestLogIn();
  getProjects();
});
