app.controller('ProjectsController', function($scope, $window, $http, SortDataService) {
  /*** SETUP FUNCTIONS ***/

  //check if there is a user logged in
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

        //check if the logged user is unregistered
        if($scope.username.includes('unregistered@decspace.com'))
          $scope.unregistered_user = true;
        else
          $scope.unregistered_user = false;
        });
      }
    });
  }

  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      if(!$scope.username.includes('unregistered@decspace.com')) {
        //mark the user as logged off
        $http.get('/accounts').then(function(response) {
          var previous_proj, new_proj;

          for(account in response.data)
            if(response.data[account].email == $scope.username) {
              //delete the id of the account
              delete response.data[account]['_id'];
              //store the current account
              previous_proj = angular.copy(response.data[account]);

              response.data[account].logged_in = false;

              new_proj = response.data[account];
              break;
            }

          $http.put('/accounts', [previous_proj, new_proj]).then(function() {
            $window.location.href = '../../index.html';
          });
        });
      }
      else
        $window.location.href = '../../index.html';
    });
  }

  //the order that projects should be retrieved from the database
  var currentOrder = ['', ''];

  //get the created projects of the currently logged user
  function getProjects() {
    $http.get('/projects').then(function(response) {
      var user_projects = [];

      //get the created projects by the logged user
      for(project in response.data)
        if(response.data[project].username == $scope.username && response.data[project].method == undefined)
          user_projects.push(response.data[project]);

      $scope.projects = user_projects;

      //sort projects
      sortProjects();

      //show/hide the "delete all projects" button
      if($scope.projects.length == 0)
        $scope.showDeleteAll = false;
      else
        $scope.showDeleteAll = true;
    });
  }

  /*** PROJECTS FUNCTIONS ***/

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
    
    if($scope.project.privacy_setting == undefined || $scope.project.privacy_setting == '') {
      $('#new-project-privacy').addClass('has-error');
      can_add_project = false;
    }
    else
      $('#new-project-privacy').removeClass('has-error');
    
    if(can_add_project) {
      //get all projects from the database
      $http.get('/projects').then(function(response) {
        //get current date
        var current_date = new Date();
        var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

        //get the biggest project_id of the logged user
        var project_id = 0;

        for(project in response.data)
          if(response.data[project].username == $scope.username && response.data[project].project_id > project_id)
            project_id = response.data[project].project_id;
        
        project_id++;

        //create the new project
        var new_proj = {};
        new_proj.project_id = project_id;
        new_proj.username = $scope.username;
        new_proj.name = $scope.project.name;
        new_proj.creation_date = creation_date;
        new_proj.last_update = creation_date;
        new_proj.archive = [];
        new_proj.privacy_setting = $scope.project.privacy_setting;

        //add the new project to the database
        $http.post('/projects', new_proj).then(function() {
          //refresh the list of projects
          getProjects();
          
          //reset the input fields
          $scope.project.name = '';
          $('#new-project-name').removeClass('has-error');
          $scope.project.privacy_setting = '';
          $('#new-project-privacy').removeClass('has-error');
        });
      });
    }
  }

  //open a certain project
  $scope.openProject = function(project) {
    $window.location.href = '../workspace/workspace.html?id=' + project['project_id'];
  }

  //duplicate a certain project
  $scope.duplicateProject = function(project) {
    //get all projects from the database
    $http.get('/projects').then(function(response) {
      //get current date
      var current_date = new Date();
      var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the biggest project_id of the logged user
      var project_id = 0;

      for(proj in response.data) {
        if(response.data[proj]['username'] == $scope.username && response.data[proj]['project_id'] > project_id)
          project_id = response.data[proj]['project_id'];
      }
      project_id++;

      //define the copy number
      var copy_number = 0;

      for(proj in response.data)
        if(response.data[proj].name == project.name && response.data[proj].username == $scope.username && response.data[proj].copy_number > copy_number)
          copy_number = response.data[proj].copy_number;
      
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

  //id of the selected project to be deleted
  $scope.delete_id_project = '';

  //select a certain project to be deleted
  $scope.deleteProject = function(project) {
    $scope.delete_id_project = project.project_id;
  }

  //delete the selected project
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
        //reset the id of the deleted project
        $scope.delete_id_project = '';
      });
    });
  }

  //deselect the selected project to be deleted
  $scope.cancelDelete = function() {
    $scope.delete_id_project = '';
  }

  //confirm the deletion of all projects of the current user
  $scope.confirmDeleteAll = function() {
    $http.get('/projects').then(function(response) {
      var id_doc;

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj].method == undefined) {
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

  /*** ORDER PROJECTS FUNCTIONS ***/

  //reorder the projects by "attr" and "dir"
  $scope.changeCurrentOrder = function(attr, dir) {
    //store the current attr and dir, in case a new project is added
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

    $scope.delete_id_project = '';
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  getProjects();
});
