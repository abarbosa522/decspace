app.controller('OrderByMethodController', function($scope, $window, $http) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  //keep the value of the selectedCriterion
  var selectedCriterion = '';

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

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').success(function(res) {
      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '/' + (current_date.getMonth() + 1) + '/' + current_date.getFullYear();

      //projects of the logged user
      var user_proj;

      for(user in res) {
        if(res[user].username == $scope.username)
          user_proj = res[user];
      }

      for(project in user_proj['projects']) {
        if(user_proj['projects'][project]['id'] == proj_id) {
          //rewrite "last_update"
          user_proj['projects'][project]['last_update'] = last_update;
          //store the selected method
          $scope.method_name = user_proj['projects'][project]['method'];
        }
      }

      //get the id of the document and then remove it from the new one
      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
          getCriteria();
          getSelectedCriterion();
        });
      });
    });
  }

  function getCriteria() {
    $http.get('/projects').success(function(res) {
      //projects of the logged user
      var user_proj;

      for(user in res) {
        if(res[user].username == $scope.username)
          user_proj = res[user];
      }

      for(project in user_proj['projects']) {
        if(user_proj['projects'][project]['id'] == proj_id) {
          //get the criteria previously added
          $scope.criteria = user_proj['projects'][project]['criteria'];
        }
      }
    });
  }

  $scope.addCriterion = function() {
    $http.get('/projects').success(function(res) {
      //projects of the logged user
      var user_proj;

      for(user in res) {
        if(res[user].username == $scope.username)
          user_proj = res[user];
      }

      for(project in user_proj['projects']) {
        if(user_proj['projects'][project]['id'] == proj_id) {
          //insert criterion into database
          user_proj['projects'][project]['criteria'].push({'name':$scope.new_criterion.name,'type':$scope.new_criterion.type,'direction':$scope.new_criterion.direction});
        }
      }

      //get the id of the document and then remove it from the new one
      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
          //refresh the list of projects
          getCriteria();
          //reset the input fields
          $scope.new_criterion.name = '';
          $scope.new_criterion.type = '';
          $scope.new_criterion.direction = '';
        });
      });
    });
  }

  $scope.selectCriterion = function(criterion) {
    $http.get('/projects').success(function(res) {
      //projects of the logged user
      var user_proj;

      for(user in res) {
        if(res[user].username == $scope.username)
          user_proj = res[user];
      }

      for(project in user_proj['projects']) {
        if(user_proj['projects'][project]['id'] == proj_id) {
          //insert or "rewrite" selected criterion in db
          user_proj['projects'][project]['order_by_criterion'] = criterion.name;
        }
      }

      //get the id of the document and then remove it from the new one
      var id_doc = user_proj['_id'];
      delete user_proj['_id'];

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', user_proj).success(function() {
          selectedCriterion = criterion.name;
        });
      });
    });
  }

  function getSelectedCriterion() {
    $http.get('/projects').success(function(res) {
      //projects of the logged user
      var user_proj;

      for(user in res) {
        if(res[user].username == $scope.username)
          user_proj = res[user];
      }

      for(project in user_proj['projects']) {
        if(user_proj['projects'][project]['id'] == proj_id) {
          //get the selected criterion
          selectedCriterion = user_proj['projects'][project]['order_by_criterion'];
        }
      }
    });
  }

  $scope.isCriterionSelected = function(criterion) {
    if(selectedCriterion == criterion.name)
      return true;
    else
      return false;
  }

  requestLogIn();
  rewriteLastUpdate();
});
