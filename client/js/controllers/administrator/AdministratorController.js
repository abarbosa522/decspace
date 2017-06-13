app.controller('AdministratorController', function($scope, $window, $http) {
  /*** SETUP FUNCTIONS ***/

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
      //mark the user as logged off
      $http.get('/accounts').then(function(response) {
        var id_doc, proj_res;

        for(account in response.data)
          if(response.data[account].email == $scope.username) {
            response.data[account].logged_in = false;

            id_doc = response.data[account]['_id'];
            proj_res = response.data[account];
            delete proj_res['_id'];
            break;
          }

        //delete the previous document with the list of projects
        $http.delete('/accounts/' + id_doc).then(function() {
          //add the new list of projects
          $http.post('/accounts', proj_res).then(function() {
            $window.location.href = '../../index.html';
          });
        });
      });
    });
  }

  /*** DATA FUNCTIONS - USERS ***/

  var admin_email = 'admin@admin';

  function getUsers() {
    $http.get('/accounts').then(function(response) {
      var new_users = response.data;

      //remove the administrator account
      for(user in new_users)
        if(new_users[user].email == admin_email)
          new_users.splice(user, 1);

      $http.get('/projects').then(function(response2) {
        for(user in new_users) {
          var num_proj = 0;

          for(proj in response2.data)
            if(response2.data[proj].username == new_users[user].email)
              num_proj++;

          new_users[user].num_projects = num_proj;
        }

        $scope.users = new_users;

        sortUsers();
      });
    });
  }

  $scope.delete_id_user = '';

  $scope.deleteUser = function(user) {
    $scope.delete_id_user = user.email;
  }

  $scope.confirmDeleteUser = function(user) {
    $http.get('/accounts').then(function(response) {
      var id_doc;

      for(user_db in response.data)
        if(response.data[user_db].email == user.email)
          id_doc = response.data[user_db]['_id'];

      $http.delete('/accounts/' + id_doc).then(function() {
        getUsers();

        $http.get('/projects').then(function(response2) {
          for(proj in response2.data)
            if(response2.data[proj].username == user.email)
              $http.delete('/projects/' + response2.data[proj]['_id']);

          getProjects();
          $scope.delete_id_user = '';
        });
      });
    });
  }

  $scope.cancelDeleteUser = function() {
    $scope.delete_id_user = '';
  }

  /*** DATA FUNCTIONS - PROJECTS ***/

  function getProjects() {
    $http.get('/projects').then(function(response) {
      var new_projects = response.data;

      //remove the administrator projects
      for(proj in new_projects) {
        if(new_projects[proj].username == admin_email)
          new_projects.splice(proj, 1);
        else {
          if(new_projects[proj].method != undefined)
            new_projects[proj].type = 'Single-Method';
          else
            new_projects[proj].type = 'Multi-Method';
        }
      }

      $scope.projects = new_projects;

      sortProjects();
    });
  }

  $scope.delete_id_project = ['', ''];

  $scope.deleteProject = function(project) {
    $scope.delete_id_project = [project.project_id, project.username];
  }

  $scope.confirmDeleteProject = function(project) {
    $http.get('/projects').then(function(response) {
      for(proj in response.data)
        if(response.data[proj].project_id == project.project_id && response.data[proj].username == project.username)
          $http.delete('/projects/' + response.data[proj]['_id']);

      getProjects();
      $scope.delete_id_project = ['', ''];
    });
  }

  $scope.cancelDeleteProject = function() {
    $scope.delete_id_project = ['', ''];
  }

  /*** SORT FUNCTIONS ***/
  var users_sort = ['', ''];

  $scope.newSortUsers = function(attr, dir) {
    users_sort = [attr, dir];
    sortUsers();
  }

  function sortUsers() {
    if(users_sort[0] != '' && users_sort[1] != '') {
      if(users_sort[0] == 'last_login' || users_sort[0] == 'sign_up_date')
        $scope.users.sort(sortDates(users_sort[0], users_sort[1]));
      else
        $scope.users.sort(sortData(users_sort[0], users_sort[1]));
    }
  }

  var projects_sort = ['', ''];

  $scope.newSortProjects = function(attr, dir) {
    projects_sort = [attr, dir];
    sortProjects();
  }

  function sortProjects() {
    if(projects_sort[0] != '' && projects_sort[1] != '') {
      if(projects_sort[0] == 'creation_date' || projects_sort[0] == 'last_update')
        $scope.projects.sort(sortDates(projects_sort[0], projects_sort[1]));
      else
        $scope.projects.sort(sortData(projects_sort[0], projects_sort[1]));
    }
  }

  function sortData(order, direction) {
    return function(a, b) {
      var var1, var2;

      if(typeof a[order] == 'string')
        var1 = a[order].toLowerCase();
      else if(typeof a[order] == 'boolean')
        var1 = a[order].toString();
      else
        var1 = a[order];

      if(typeof b[order] == 'string')
        var2 = b[order].toLowerCase();
      else if(typeof b[order] == 'boolean')
        var2 = b[order].toString();
      else
        var2 = b[order];

      if(direction == 'ascendant') {
        if(var1 < var2)
          return -1;
        if(var1 > var2)
          return 1;
        return 0;
      }
      else {
        if(var1 < var2)
          return 1;
        if(var1 > var2)
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

  requestLogIn();
  getUsers();
  getProjects();
});
