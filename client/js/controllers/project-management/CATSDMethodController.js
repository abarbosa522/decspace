app.controller('CATSDMethodController', function($scope, $window, $http, CATSDService) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  $scope.criteria = [];
  $scope.deleteIdCriterion = '';

  $scope.new_branch = [];
  $scope.deleteIdBranch = ['', ''];

  $scope.actions = [];
  $scope.deleteIdAction = '';

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
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response[proj]['name'];
          //change the date of the last update of the project
          response[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {

        });
      });
    });
  }

  $scope.addCriterion = function() {
    $scope.new_criterion.id = $scope.criteria.length + 1;
    $scope.new_criterion.branches = [];
    $scope.criteria.push(angular.copy($scope.new_criterion));

    //reset the input fields
    $scope.new_criterion.direction = '';
    $scope.new_criterion.weight = '';
    $scope.new_criterion.name = '';
  }

  $scope.deleteCriterion = function(criterion) {
    $scope.deleteIdCriterion = criterion.id;
  }

  $scope.confirmDeleteCriterion = function(criterion) {
    $scope.criteria.splice($scope.criteria.indexOf(criterion), 1);
    $scope.deleteIdCriterion = '';
  }

  $scope.cancelDeleteCriterion = function() {
    $scope.deleteIdCriterion = '';
  }

  $scope.addBranch = function(criterionId) {
    $scope.new_branch[criterionId].id = $scope.criteria[criterionId - 1].branches.length + 1;
    $scope.criteria[criterionId - 1].branches.push(angular.copy($scope.new_branch[criterionId]));

    //reset input fields
    $scope.new_branch[criterionId].function = '';
    $scope.new_branch[criterionId].condition = '';
  }

  $scope.deleteBranch = function(criterion, branch) {
    $scope.deleteIdBranch[0] = criterion.id;
    $scope.deleteIdBranch[1] = branch.id;
  }

  $scope.confirmDeleteBranch = function(criterion, branch) {
    $scope.criteria[criterion.id - 1].branches.splice($scope.criteria[criterion.id - 1].branches.indexOf(branch), 1);
    $scope.deleteIdBranch = ['', ''];
  }

  $scope.cancelDeleteBranch = function() {
    $scope.deleteIdBranch = ['', ''];
  }

  $scope.addAction = function() {
    $scope.new_action.id = $scope.actions.length + 1;
    $scope.actions.push(angular.copy($scope.new_action));

    //reset the input fields
    $scope.new_action.name = '';
    for(criterion in $scope.criteria)
      $scope.new_action[$scope.criteria[criterion]['name']] = '';

    console.log($scope.actions);
  }

  $scope.deleteAction = function(action) {
    $scope.deleteIdAction = action.id;
  }

  $scope.confirmDeleteAction = function(action) {
    $scope.actions.splice($scope.actions.indexOf(action), 1);
    $scope.deleteIdAction = '';
  }

  $scope.cancelDeleteAction = function() {
    $scope.deleteIdAction = '';
  }

  requestLogIn();
  rewriteLastUpdate();
});
