app.controller('CATSDMethodController', function($scope, $window, $http, CATSDService) {
  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  $scope.criteria = [];
  $scope.deleteIdCriterion = '';

  $scope.interaction_effects = [];
  $scope.deleteIdInteractionEffect = '';

  $scope.new_branch = [];
  $scope.deleteIdBranch = ['', ''];

  $scope.actions = [];
  $scope.deleteIdAction = '';

  $scope.categories = [];
  $scope.deleteIdCategory = '';

  $scope.new_reference_action = [];
  $scope.deleteIdReferenceAction = ['', ''];

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
          getData();
        });
      });
    });
  }

  $scope.addCriterion = function() {
    if($scope.criteria.length == 0)
      $scope.new_criterion.id = 1;
    else
      $scope.new_criterion.id = $scope.criteria[$scope.criteria.length - 1].id + 1;

    if(typeof $scope.new_criterion.direction == 'undefined')
      $scope.new_criterion.direction = '';

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

  $scope.addInteractionEffect = function() {
    if($scope.interaction_effects.length == 0)
      $scope.new_interaction_effect.id = 1;
    else
      $scope.new_interaction_effect.id = $scope.interaction_effects[$scope.interaction_effects.length - 1].id + 1;

    if(typeof $scope.new_interaction_effect.type == 'undefined')
      $scope.new_interaction_effect.type = '';

    if(typeof $scope.new_interaction_effect.criterion1 == 'undefined')
      $scope.new_interaction_effect.criterion1 = '';

    if(typeof $scope.new_interaction_effect.criterion2 == 'undefined')
      $scope.new_interaction_effect.criterion2 = '';

    $scope.interaction_effects.push(angular.copy($scope.new_interaction_effect));

    //reset the input fields
    $scope.new_interaction_effect.type = '';
    $scope.new_interaction_effect.criterion1 = '';
    $scope.new_interaction_effect.criterion2 = '';
    $scope.new_interaction_effect.value = '';
  }

  $scope.deleteInteractionEffect = function(interaction) {
    $scope.deleteIdInteractionEffect = interaction.id;
  }

  $scope.confirmDeleteInteractionEffect = function(interaction) {
    $scope.interaction_effects.splice($scope.interaction_effects.indexOf(interaction), 1);
    $scope.deleteIdInteractionEffect = '';
  }

  $scope.cancelDeleteInteractionEffect = function() {
    $scope.deleteIdInteractionEffect = '';
  }

  $scope.addBranch = function(criterion) {
    if($scope.criteria[$scope.criteria.indexOf(criterion)].branches.length == 0)
      $scope.new_branch[criterion.id].id = 1;
    else
      $scope.new_branch[criterion.id].id = $scope.criteria[$scope.criteria.indexOf(criterion)].branches[$scope.criteria[$scope.criteria.indexOf(criterion)].branches.length - 1].id + 1;

    $scope.criteria[$scope.criteria.indexOf(criterion)].branches.push(angular.copy($scope.new_branch[criterion.id]));

    //reset input fields
    $scope.new_branch[criterion.id].function = '';
    $scope.new_branch[criterion.id].condition = '';
  }

  $scope.deleteBranch = function(criterion, branch) {
    $scope.deleteIdBranch[0] = criterion.id;
    $scope.deleteIdBranch[1] = branch.id;
  }

  $scope.confirmDeleteBranch = function(criterion, branch) {
    $scope.criteria[$scope.criteria.indexOf(criterion)].branches.splice($scope.criteria[$scope.criteria.indexOf(criterion)].branches.indexOf(branch), 1);
    $scope.deleteIdBranch = ['', ''];
  }

  $scope.cancelDeleteBranch = function() {
    $scope.deleteIdBranch = ['', ''];
  }

  $scope.addAction = function() {
    if($scope.actions.length == 0)
      $scope.new_action.id = 1;
    else
      $scope.new_action.id = $scope.actions[$scope.actions.length - 1].id + 1;

    $scope.actions.push(angular.copy($scope.new_action));

    //reset the input fields
    $scope.new_action.name = '';
    for(criterion in $scope.criteria)
      $scope.new_action[$scope.criteria[criterion]['name']] = '';
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

  $scope.addCategory = function() {
    if($scope.categories.length == 0)
      $scope.new_category.id = 1;
    else
      $scope.new_category.id = $scope.categories[$scope.categories.length - 1].id + 1;

    $scope.new_category.reference_actions = [];
    $scope.categories.push(angular.copy($scope.new_category));

    //reset the input fields
    $scope.new_category.name = '';
    $scope.new_category.membership_degree = '';
    for(criterion in $scope.criteria)
      $scope.new_category[$scope.criteria[criterion]['name']] = '';
  }

  $scope.deleteCategory = function(category) {
    $scope.deleteIdCategory = category.id;
  }

  $scope.confirmDeleteCategory = function(category) {
    $scope.categories.splice($scope.categories.indexOf(category), 1);
    $scope.deleteIdCategory = '';
  }

  $scope.cancelDeleteCategory = function() {
    $scope.deleteIdCategory = '';
  }

  $scope.addReferenceAction = function(category, index) {
    if($scope.categories[$scope.categories.indexOf(category)].reference_actions.length == 0)
      $scope.new_reference_action[category.id].id = 1;
    else
      $scope.new_reference_action[category.id].id = $scope.categories[$scope.categories.indexOf(category)].reference_actions[$scope.categories[$scope.categories.indexOf(category)].reference_actions.length - 1].id + 1;

    $scope.new_reference_action[category.id].name = 'b' + (index + 1) + ($scope.categories[$scope.categories.indexOf(category)].reference_actions.length + 1);

    $scope.categories[$scope.categories.indexOf(category)].reference_actions.push(angular.copy($scope.new_reference_action[category.id]));

    //reset the input fields
    $scope.new_reference_action[category.id].name = '';
    for(criterion in $scope.criteria)
      $scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] = '';
  }

  $scope.deleteReferenceAction = function(category, reference_action) {
    $scope.deleteIdReferenceAction[0] = category.id;
    $scope.deleteIdReferenceAction[1] = reference_action.id;
  }

  $scope.confirmDeleteReferenceAction = function(category, ref) {
    $scope.categories[$scope.categories.indexOf(category)].reference_actions.splice($scope.categories[$scope.categories.indexOf(category)].reference_actions.indexOf(ref), 1);
    $scope.deleteIdReferenceAction = ['', ''];
  }

  $scope.cancelDeleteReferenceAction = function() {
    $scope.deleteIdReferenceAction = ['', ''];
  }

  $scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {

          //insert criteria
          response[proj]['criteria'] = $scope.criteria;
          //insert interaction effects
          response[proj]['interaction_effects'] = $scope.interaction_effects;
          //insert actions
          response[proj]['actions'] = $scope.actions;
          //insert categories
          response[proj]['categories'] = $scope.categories;

          //get the id of the document
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          $scope.showSaveSuccess = true;
        });
      });
    });
  }

  function getData() {
    $http.get('/projects').success(function(response) {
      //get the current project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get criteria
          if(typeof response[proj]['criteria'] == 'undefined')
            $scope.criteria = [];
          else
            $scope.criteria = response[proj]['criteria'];

          //get interaction effects
          if(typeof response[proj]['interaction_effects'] == 'undefined')
            $scope.interaction_effects = [];
          else
            $scope.interaction_effects = response[proj]['interaction_effects'];

          //get actions
          if(typeof response[proj]['actions'] == 'undefined')
            $scope.actions = [];
          else
            $scope.actions = response[proj]['actions'];

          //get categories
          if(typeof response[proj]['categories'] == 'undefined')
            $scope.categories = [];
          else
            $scope.categories = response[proj]['categories'];
        }
      }
    });
  }

  $scope.getResults = function() {
    var results = CATSDService.getResults($scope.criteria, $scope.interaction_effects, $scope.actions, $scope.categories);

    results.then(function(resolve) {
      console.log(resolve);
    });
  }

  requestLogIn();
  rewriteLastUpdate();
});
