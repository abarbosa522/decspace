app.controller('ProjectsController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

  //check if there is a user logged in
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

      getProjects();
    });
  }

  //user log out
  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //the order that projects should be retrieved from the database
  var currentOrder = ['', ''];

  //get the created projects of the currently logged user
  function getProjects() {
    $http.get('/projects').success(function(response) {
      var user_projects = [];

      //get the created projects by the logged user
      for(project in response)
        if(response[project].username == $scope.username)
          user_projects.push(response[project]);

      $scope.projects = user_projects;

      //sort projects
      if(currentOrder[0] != '' && currentOrder[1] != '')
        $scope.projects.sort(sortData(currentOrder[0], currentOrder[1]));

      //show/hide the "delete all projects" button
      if($scope.projects.length == 0)
        $scope.showDeleteAll = false;
      else
        $scope.showDeleteAll = true;
    });
  }

  /*** PROJECTS FUNCTIONS ***/

  //add a new project
  $scope.addProject = function() {
    //if a name for the new projects was not defined
    if(typeof $scope.project.name == 'undefined' || $scope.project.name == '') {
      //show name alert and don't add the project
      $scope.showNameErrorAlert = true;
    }
    else {
      //hide alerts, in case they were showing before
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
        var new_proj = {};
        new_proj['project_id'] = project_id;
        new_proj['username'] = $scope.username;
        new_proj['name'] = $scope.project.name;
        new_proj['creation_date'] = creation_date;
        new_proj['last_update'] = creation_date;

        //add the new project to the database
        $http.post('/projects', new_proj).success(function() {
          //refresh the list of projects
          getProjects();
          //reset the input fields
          $scope.project.name = '';
        });
      });
    }
  }

  //open a certain project
  $scope.openProject = function(project) {
    $window.location.href = 'workspace.html?id=' + project['project_id'];
  }

  //duplicate a certain project
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
      var new_proj = angular.copy(project);
      delete new_proj['_id'];
      new_proj['project_id'] = project_id;
      new_proj['name'] += ' - Copy';
      new_proj['creation_date'] = creation_date;
      new_proj['last_update'] = creation_date;

      //add the new list of projects
      $http.post('/projects', new_proj).success(function() {
        //refresh the list of projects
        getProjects();
      });
    });
  }

  //id of the selected project to be deleted
  $scope.delete_id_project = '';

  //select a certain project to be deleted
  $scope.deleteProject = function(project) {
    $scope.delete_id_project = project.project_id;
  }

  //delete the selected project
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
        //reset the id of the deleted project
        $scope.delete_id_project = '';
      });
    });
  }

  //deselect the selected project to be deleted
  $scope.cancelDelete = function() {
    $scope.delete_id_project = '';
  }

  //select all projects to be deleted
  $scope.deleteAllProjects = function() {
    $scope.delete_id_project = 'all';
  }

  //confirm the deletion of all projects of the current user
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

      $scope.delete_id_project = '';
    });
  }

  //cancel the selection of all projects
  $scope.cancelDeleteAll = function() {
    $scope.delete_id_project = '';
  }

  /*** ORDER PROJECTS FUNCTIONS ***/

  //reorder the projects by "attr" and "dir"
  $scope.changeCurrentOrder = function(attr, dir) {
    //store the current attr and dir, in case a new project is added
    currentOrder = [attr, dir];

    //sort the project by attr and dir
    if(attr == 'creation_date' || attr == 'last_update')
      $scope.projects.sort(sortDates(attr, dir));
    else
      $scope.projects.sort(sortData(attr, dir));
  }

  //sort by "order" and "direction"
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

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
});
