app.controller('ProjectManagementController', function($scope, $window, $http) {

  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      if(typeof res.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else
        $scope.username = res.user;
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  $scope.starProject = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(res) {
      var user_proj = '';

      //get the other previously stored projects by the logged user
      for(proj in res) {
        if(res[proj].username == $scope.username)
          user_proj = res[proj];
      }

      for(proj in user_proj['projects']) {
        if(user_proj['projects'][proj]['id'] == project.id) {
          user_proj['projects'][proj]['starred'] = 'true';
          break;
        }
      }

      //get the id of the document and then remove it from the new one
      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
          //refresh the list of projects
          getProjects();
        });
      });
    });
  }

  $scope.unstarProject = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(res) {
      var user_proj = '';

      //get the other previously stored projects by the logged user
      for(proj in res) {
        if(res[proj].username == $scope.username)
          user_proj = res[proj];
      }

      for(proj in user_proj['projects']) {
        if(user_proj['projects'][proj]['id'] == project.id) {
          user_proj['projects'][proj]['starred'] = 'false';
          break;
        }
      }

      //get the id of the document and then remove it from the new one
      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
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
        $window.location.href = 'order-by-method.html?id=' + project.id;
        break;
    }
  }

  //add a new project
  $scope.addProject = function() {
    //if a method has not chosen
    if(typeof $scope.project.method == 'undefined') {
      //show alert and don't add the project
      $scope.showErrorAlert = true;
    }
    else {
      //hide alert, in case it was showing before
      $scope.showErrorAlert = false;


      //get all projects from the database
      $http.get('/projects').success(function(res) {
        var user_proj = '';

        //get the other previously stored projects by the logged user
        for(project in res) {
          if(res[project].username == $scope.username)
            user_proj = res[project];
        }

        //get current date
        var current_date = new Date();
        var creation_date = current_date.getDate() + '/' + (current_date.getMonth() + 1) + '/' + current_date.getFullYear();

        //if the user did not create any projects previously
        if(user_proj == '') {
          //create the new project
          var proj_text = '{"username":"' + $scope.username + '","projects":[{"id":1,"name":"' + $scope.project.name + '","starred":"false","method":"' + $scope.project.method + '","creation_date":"' + creation_date + '","last_update":"' + creation_date + '","criteria":[],"order_by_criterion":"","actions":[],"executions":[]}]}';

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
        }
        else {
          //get the id of the last added project and increment it
          var id;

          //if there are other added projects
          if(user_proj['projects'].length >= 1)
            id = user_proj['projects'][user_proj['projects'].length - 1]['id'] + 1;
          else
            id = 1;

          //add the new project to the list of projects of the logged user
          user_proj['projects'].push({'id':id,'name':$scope.project.name,'starred':'false','method':$scope.project.method,'creation_date':creation_date,'last_update':creation_date,'criteria':[],'order_by_criterion':'','actions':[],'executions':[]});

          //get the id of the document and then remove it from the new one
          var id_doc = user_proj['_id'];
          delete user_proj['_id'];

          //delete the previous document with the list of projects
          $http.delete('/projects/' + id_doc).success(function(){
            //add the new list of projects
            $http.post('/projects', user_proj).success(function() {
              //refresh the list of projects
              getProjects();
              //reset the input fields
              $scope.project.name = '';
              $scope.project.method = '';
            });
          });
        }
      });
    }
  }

  //edit the name of a certain project
  $scope.editProject = function(project) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#proj-list-' + project.id)).addClass('no-display');
    angular.element(document.querySelector('#proj-edit-' + project.id)).removeClass('no-display');

    //disable all other open, edit, duplicate or delete buttons
    angular.element(document.querySelectorAll('.btn-open, .btn-edit, .btn-duplicate, .btn-delete, .btn-star-empty, .btn-star, .btn-add')).prop('disabled', true);
  }

  //confirm edit changes
  $scope.confirmEdit = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(res) {
      var user_proj = '';

      //get the other previously stored projects by the logged user
      for(user in res) {
        if(res[user].username == $scope.username)
          user_proj = res[user];
      }

      //find project
      for(proj in user_proj['projects'])
        if(user_proj['projects'][proj]['id'] == project.id)
          user_proj['projects'][proj]['name'] = project.name;

      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
          //refresh the list of projects and the initial view
          getProjects();
          //enable the add button
          angular.element(document.querySelectorAll('.btn-add')).prop('disabled', false);
        });
      });
    });
  }

  //cancel edit changes
  $scope.cancelEdit = function(project) {
    getProjects();
    //enable the add button
    angular.element(document.querySelectorAll('.btn-add')).prop('disabled', false);
  }

  //duplicate a project
  $scope.duplicateProject = function(project) {
    //get all projects from the database
    $http.get('/projects').success(function(res) {
      var user_proj;

      //get the other previously stored projects by the logged user
      for(proj in res) {
        if(res[proj].username == $scope.username)
          user_proj = res[proj];
      }

      //get current date
      var current_date = new Date();
      var creation_date = current_date.getDate() + '/' + (current_date.getMonth() + 1) + '/' + current_date.getFullYear();

      //get the id of the last added project and increment it
      var id = user_proj['projects'][user_proj['projects'].length - 1]['id'] + 1;

      //add the new project to the list of projects of the logged user
      user_proj['projects'].push({'id':id,'name':project.name,'starred':project.starred,'method':project.method,'creation_date':creation_date,'last_update':creation_date,'criteria':project.criteria,'order_by_criterion':project.order_by_criterion,'actions':project.actions,'executions':project.results});

      //get the id of the document and then remove it from the new one
      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
          //refresh the list of projects
          getProjects();
        });
      });
    });
  }

  //delete a certain project
  $scope.deleteProject = function(project) {
    //hide the listed project and show the edit view
    angular.element(document.querySelector('#proj-list-' + project.id)).addClass('no-display');
    angular.element(document.querySelector('#proj-delete-' + project.id)).removeClass('no-display');

    //disable all other open, edit, duplicate or delete buttons
    angular.element(document.querySelectorAll('.btn-open, .btn-edit, .btn-duplicate, .btn-delete, .btn-star-empty, .btn-star, .btn-add')).prop('disabled', true);
  }

  $scope.confirmDelete = function(project) {
    $http.get('/projects').success(function(res) {
      var user_proj;

      //find the projects of the logged user
      for(user in res)
        if(res[user].username == $scope.username)
          user_proj = res[user];

      //find the project to be deleted by its id
      for(proj in user_proj['projects'])
        if(user_proj['projects'][proj]['id'] == project['id'])
          break;

      //delete the project from the json object
      user_proj['projects'].splice(proj, 1);

      //store and delete the id of the document
      var id = user_proj['_id'];
      delete user_proj['_id'];

      $http.delete('/projects/' + id).success(function() {
        $http.post('/projects', user_proj).success(function() {
          //refresh the list of projects
          getProjects();
          //enable the add button
          angular.element(document.querySelectorAll('.btn-add')).prop('disabled', false);
        });
      });
    });
  }

  $scope.cancelDelete = function(project) {
    getProjects();
    //enable the add button
    angular.element(document.querySelectorAll('.btn-add')).prop('disabled', false);
  }

  function getProjects() {
    $http.get('/projects').success(function(res) {
      var starred_projects = [], unstarred_projects = [];
      //get the other previously stored project by the logged user
      for(user in res) {
        if(res[user].username == $scope.username) {
          for(project in res[user]['projects']) {
            if(res[user]['projects'][project]['starred'] == 'true')
              starred_projects.push(res[user]['projects'][project])
            else
              unstarred_projects.push(res[user]['projects'][project])
          }
        }
      }

      //put starred_projects first
      $scope.projects = starred_projects;
      for(project in unstarred_projects)
        $scope.projects.push(unstarred_projects[project]);
    });
  }

  requestLogIn();
  getProjects();
});
