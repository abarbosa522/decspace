app.controller('PublicProjectsController', function($scope, $window, $http, SortDataService) {
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
      var public_projects = [];

      //get the created projects by the logged user
      for(project in response.data)
        if(response.data[project].privacy_setting == 'Public')
          public_projects.push(response.data[project]);

      $scope.projects = public_projects;

      //sort projects
      sortProjects();
    });
  }

  /*** PROJECTS FUNCTIONS ***/

  $scope.project = {};

  //open a certain project
  $scope.openProject = function(project) {
    console.log(project)
    $window.location.href = '../workspace/workspace.html?id=' + project.project_id + '&public=y&user=' + project.username;
  }

  //clone a certain project to the "My Projects" area
  $scope.cloneProject = function(project) {
    //get all projects from the database
    $http.get('/projects').then(function(response) {
      //get current date
      var current_date = new Date();
      var creation_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the biggest project_id of the logged user
      var project_id = 0;

      for(proj in response.data)
        if(response.data[proj].username == $scope.username && response.data[proj].project_id > project_id)
          project_id = response.data[proj].project_id;
      
      project_id++;

      //define the copy number
      var copy_number = 0;

      for(proj in response.data)
        if(response.data[proj].name == project.name && response.data[proj].username == $scope.username)
          copy_number++;
      
      //create the new project
      var new_proj = angular.copy(project);
      delete new_proj['_id'];
      new_proj.project_id = project_id;
      new_proj.creation_date = creation_date;
      new_proj.last_update = creation_date;
      
      if(copy_number > 0)
        new_proj.copy_number = copy_number;
      
      //change the username of the project
      new_proj.username = $scope.username;
      
      //add the new list of projects
      $http.post('/projects', new_proj).then(function() {
        //refresh the list of projects
        getProjects();
      });
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
