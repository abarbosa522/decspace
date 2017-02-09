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

  $scope.addProject = function() {
    console.log($scope.project.method);
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

        //get the other previously stored project by the logged user
        for(project in res) {
          if(res[project].username == $scope.username)
            user_proj = res[project];
        }

        var current_date = new Date();

        var creation_date = current_date.getDate() + '/' + (current_date.getMonth() + 1) + '/' + current_date.getFullYear();

        //create the new project
        var proj_text = '{"username":"' + $scope.username + '","projects":[{"name":"' + $scope.project.name + '","method":"' + $scope.project.method + '","creation_date":"' + creation_date + '","last_update":"' + creation_date + '"},';

        //store every project in the same
        for(project in user_proj['projects']) {
          proj_text += '{"name":"' + user_proj['projects'][project]['name'] + '","method":"' + user_proj['projects'][project]['method'] + '","creation_date":"' + user_proj['projects'][project]['creation_date'] + '","last_update":"' + user_proj['projects'][project]['last_update'] + '"},';
        }

        if(proj_text[proj_text.length - 1] == ',')
          proj_text = proj_text.substring(0, proj_text.length - 1);

        proj_text += ']}';

        var proj_obj = JSON.parse(proj_text);

        //if the user has already projects stored, delete the previous document and store the new one
        if(user_proj != '') {
          $http.delete('/projects/' + user_proj['_id']).success(function(res2){
              $http.post('/projects', proj_obj).success(function(res3) {
                getProjects();
                $scope.project.name = '';
                $scope.project.method = '';
              });
          });
        }
        else {
          $http.post('/projects', proj_obj).success(function(res4) {
            getProjects();
            $scope.project.name = '';
            $scope.project.method = '';
          });
        }
      });
    }
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
