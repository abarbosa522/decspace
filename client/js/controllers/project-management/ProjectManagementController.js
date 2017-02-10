app.controller('ProjectManagementController', ['$scope', '$window', '$http', function($scope, $window, $http) {
  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      $scope.username = res.user;
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
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
          var proj_text = '{"username":"' + $scope.username + '","projects":[{"name":"' + $scope.project.name + '","method":"' + $scope.project.method + '","creation_date":"' + creation_date + '","last_update":"' + creation_date + '"}]}';

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
          //add the new project to the list of projects of the logged user
          user_proj['projects'].push({'name':$scope.project.name,'method':$scope.project.method,'creation_date':creation_date,'last_update':creation_date});

          //get the id of the document and then remove it from the new one
          var id = user_proj['_id'];
          delete user_proj['_id'];

          //delete the previous document with the list of projects
          $http.delete('/projects/' + id).success(function(){
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

  //delete a certain project
  $scope.deleteProject = function(project) {
    $http.get('/projects').success(function(res) {
      var user_proj;

      //find the projects of the logged user
      for(user in res)
        if(res[user].username == $scope.username)
          user_proj = res[user];

      //find the project to be deleted
      for(proj in user_proj['projects'])
        if(user_proj['projects'][proj]['name'] == project['name'] && user_proj['projects'][proj]['method'] == project['method'] && user_proj['projects'][proj]['creation_date'] == project['creation_date'] && user_proj['projects'][proj]['last_update'] == project['last_update'])
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
        });
      });
    });
  }

  function getProjects() {
    $http.get('/projects').success(function(res) {
      //get the other previously stored project by the logged user
      for(project in res) {
        if(res[project].username == $scope.username)
          $scope.projects = res[project]['projects'];
      }
    });
  }

  requestLogIn();
  getProjects();
}]);
