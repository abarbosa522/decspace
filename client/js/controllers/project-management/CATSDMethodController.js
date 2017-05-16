app.controller('CATSDMethodController', function($scope, $window, $http, CATSDService, IntegratedSRFService) {
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

  $scope.deleteIdExecution = '';

  $scope.isLoading = false;

  //eye icons variables - data input
  $scope.criteria_eye = 1;
  $scope.interaction_effects_eye = 1;
  $scope.scales_functions_eye = 1;
  $scope.actions_eye = 1;
  $scope.categories_eye = 1;
  $scope.reference_actions_eye = 1;

  //eye icons variables - executions
  $scope.criteria_exec_eye = 1;
  $scope.interaction_effects_exec_eye = 1;
  $scope.scales_functions_exec_eye = 1;
  $scope.actions_exec_eye = 1;
  $scope.categories_exec_eye = 1;
  $scope.reference_actions_exec_eye = 1;
  $scope.results_exec_eye = 1;

  $scope.currentExecution = '';
  $scope.compareExecution = '';

  $scope.integratedSRFService = IntegratedSRFService;

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
        });
      }
    });
  }

  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response.data[proj]['name'];
          //change the date of the last update of the project
          response.data[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          $scope.reloadData(false);
          getExecutions();
        });
      });
    });
  }

  //hide all alerts
  function hideAlerts() {
    $('#save-success').hide();
    $('#reload-success').hide();
  }

  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    //show alert
    angular.element(document.querySelector('#' + alert_id)).alert();
    //hide alert
    angular.element(document.querySelector('#' + alert_id)).fadeTo(3000, 500).slideUp(500, function(){
      angular.element(document.querySelector('#' + alert_id)).slideUp(500);
    });
  }

  $scope.new_criterion = {};

  //add a new criterion
  $scope.addCriterion = function() {
    var can_add_criterion = true;

    //if a name has not been assigned to the new criterion - add error class
    if($scope.new_criterion.name == undefined || $scope.new_criterion.name == '') {
      $('#new-criterion-name').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-criterion-name').removeClass('has-error');

    //if a direction has not been assigned to the new criterion - add error class
    if($scope.new_criterion.direction == undefined || $scope.new_criterion.direction == '') {
      $('#new-criterion-direction').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-criterion-direction').removeClass('has-error');

    if(can_add_criterion){
      //assign an unique id to the new criterion
      if($scope.criteria.length == 0)
        $scope.new_criterion.id = 1;
      else
        $scope.new_criterion.id = $scope.criteria[$scope.criteria.length - 1]['id'] + 1;

      //add the new criterion to the
      $scope.criteria.push(angular.copy($scope.new_criterion));

      //reset the criterion input fields
      $scope.new_criterion.name = '';
      $scope.new_criterion.direction = '';

      //remove all error classes - just be sure
      $('#new-criterion-name').removeClass('has-error');
      $('#new-criterion-direction').removeClass('has-error');
    }
  }

  $scope.blurCriterionName = function(criterion) {
    if(criterion.name == '')
      $('#criterion-' + criterion.id + '-name').addClass('has-error');
    else
      $('#criterion-' + criterion.id + '-name').removeClass('has-error');
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

  $scope.new_interaction_effect = {};

  $scope.addInteractionEffect = function() {
    var can_add_interaction = true;

    //if a type of effect was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.type == undefined) {
      $('#new-interaction-type').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-interaction-type').removeClass('has-error');

    //if the first criterion was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.criterion1 == undefined) {
      $('#new-interaction-criterion1').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-interaction-criterion1').removeClass('has-error');

    //if the second criterion was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.criterion2 == undefined) {
      $('#new-interaction-criterion2').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-interaction-criterion2').removeClass('has-error');

    //if a value was not correctly assigned to the new interaction - add error class
    if(($scope.new_interaction_effect.value == undefined || $scope.new_interaction_effect.value == '')
    || (($scope.new_interaction_effect.type == 'Mutual-Strengthening Effect' && $scope.new_interaction_effect.value <= 0)
    || (($scope.new_interaction_effect.type == 'Mutual-Weakening Effect' || $scope.new_interaction_effect.type == 'Antagonistic Effect') && $scope.new_interaction_effect.value >= 0))) {
      $('#new-interaction-value').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-interaction-value').removeClass('has-error');

    if(can_add_interaction){
      if($scope.interaction_effects.length == 0)
        $scope.new_interaction_effect.id = 1;
      else
        $scope.new_interaction_effect.id = $scope.interaction_effects[$scope.interaction_effects.length - 1].id + 1;

      $scope.interaction_effects.push(angular.copy($scope.new_interaction_effect));

      //reset the input fields
      $scope.new_interaction_effect.type = '';
      $scope.new_interaction_effect.criterion1 = '';
      $scope.new_interaction_effect.criterion2 = '';
      $scope.new_interaction_effect.value = '';

      //remove all error classes
      $('#new-interaction-type').removeClass('has-error');
      $('#new-interaction-criterion1').removeClass('has-error');
      $('#new-interaction-criterion2').removeClass('has-error');
      $('#new-interaction-value').removeClass('has-error');
    }
  }

  $scope.blurInteractionValue = function(interaction) {
    if(interaction.value == '' || ((interaction.type == 'Mutual-Strengthening Effect' && interaction.value <= 0)
    || ((interaction.type == 'Mutual-Weakening Effect' || interaction.type == 'Antagonistic Effect') && interaction.value >= 0)))
      $('#interaction-' + interaction.id + '-value').addClass('has-error');
    else
      $('#interaction-' + interaction.id + '-value').removeClass('has-error');
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

  $scope.blurScaleType = function(criterion) {
    if(criterion.scale.type == '' || criterion.scale.type == undefined)
      $('#scale-' + criterion.id + '-type').addClass('has-error');
    else
      $('#scale-' + criterion.id + '-type').removeClass('has-error');
  }

  $scope.blurScaleMin = function(criterion) {
    if(criterion.scale.min == undefined)
      $('#scale-' + criterion.id + '-min').addClass('has-error');
    else if(criterion.scale.min >= criterion.scale.max && criterion.scale.min != undefined && criterion.scale.max != undefined) {
      $('#scale-' + criterion.id + '-min').addClass('has-error');
      $('#scale-' + criterion.id + '-max').addClass('has-error');
    }
    else {
      $('#scale-' + criterion.id + '-min').removeClass('has-error');
      $('#scale-' + criterion.id + '-max').removeClass('has-error');
    }
  }

  $scope.blurScaleMax = function(criterion) {
    if(criterion.scale.max == undefined)
      $('#scale-' + criterion.id + '-max').addClass('has-error');
    else if(criterion.scale.min >= criterion.scale.max && criterion.scale.min != undefined && criterion.scale.max != undefined) {
      $('#scale-' + criterion.id + '-min').addClass('has-error');
      $('#scale-' + criterion.id + '-max').addClass('has-error');
    }
    else {
      $('#scale-' + criterion.id + '-min').removeClass('has-error');
      $('#scale-' + criterion.id + '-max').removeClass('has-error');
    }
  }

  $scope.blurScaleCategories = function(criterion) {
    if(criterion.scale.num_categories < 2 || criterion.scale.num_categories == undefined)
      $('#scale-' + criterion.id + '-categories').addClass('has-error');
    else
      $('#scale-' + criterion.id + '-categories').removeClass('has-error');
  }

  $scope.new_branch = {};

  $scope.addBranch = function(criterion) {
    var can_add_branch = true;

    if($scope.new_branch[criterion.id] == undefined)
      $scope.new_branch[criterion.id] = {};

    //if a function was not assigned - add error class
    if($scope.new_branch[criterion.id].function == undefined || $scope.new_branch[criterion.id].function == '') {
      $('#new-branch-function-' + criterion.id).addClass('has-error');
      can_add_branch = false;
    }
    else
      $('#new-branch-function-' + criterion.id).removeClass('has-error');

    //if a condition was not assigned - add error class
    if($scope.new_branch[criterion.id].condition == undefined || $scope.new_branch[criterion.id].condition == '') {
      $('#new-branch-condition-' + criterion.id).addClass('has-error');
      can_add_branch = false;
    }
    else
      $('#new-branch-condition-' + criterion.id).removeClass('has-error');

    if(can_add_branch) {
      if($scope.criteria[$scope.criteria.indexOf(criterion)].branches == undefined) {
        //initialize the branches array
        $scope.criteria[$scope.criteria.indexOf(criterion)].branches = [];
        $scope.new_branch[criterion.id].id = 1;
      }
      else if($scope.criteria[$scope.criteria.indexOf(criterion)].branches.length == 0)
        $scope.new_branch[criterion.id].id = 1;
      else
        $scope.new_branch[criterion.id].id = $scope.criteria[$scope.criteria.indexOf(criterion)].branches[$scope.criteria[$scope.criteria.indexOf(criterion)].branches.length - 1].id + 1;

      $scope.criteria[$scope.criteria.indexOf(criterion)].branches.push(angular.copy($scope.new_branch[criterion.id]));

      //reset input fields
      $scope.new_branch[criterion.id].function = '';
      $scope.new_branch[criterion.id].condition = '';

      //remove all error classes
      $('#new-branch-function-' + criterion.id).removeClass('has-error');
      $('#new-branch-condition-' + criterion.id).removeClass('has-error');
    }
  }

  $scope.blurBranchFunction = function(branch, criterion) {
    if(branch.function == '' || branch.function == undefined)
      $('#branch-' + branch.id + '-function-' + criterion.id).addClass('has-error');
    else
      $('#branch-' + branch.id + '-function-' + criterion.id).removeClass('has-error');
  }

  $scope.blurBranchCondition = function(branch, criterion) {
    if(branch.condition == '' || branch.condition == undefined)
      $('#branch-' + branch.id + '-condition-' + criterion.id).addClass('has-error');
    else
      $('#branch-' + branch.id + '-condition-' + criterion.id).removeClass('has-error');
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

  $scope.new_action = {};

  $scope.addAction = function() {
    var can_add_action = true;

    //if a name was not assigned to the new action - add error class
    if($scope.new_action.name == undefined || $scope.new_action.name == '') {
      $('#new-action-name').addClass('has-error');
      can_add_action = false;
    }
    else
      $('#new-action-name').removeClass('has-error');

    //if the criterion field has not been assigned - add error class
    for(criterion in $scope.criteria) {
      if(($scope.new_action[$scope.criteria[criterion]['name']] == undefined || $scope.new_action[$scope.criteria[criterion]['name']] == "")
      || ($scope.criteria[criterion]['scale']['type'] == 'Numerical' && ($scope.new_action[$scope.criteria[criterion]['name']] < $scope.criteria[criterion]['scale']['min'] || $scope.new_action[$scope.criteria[criterion]['name']] > $scope.criteria[criterion]['scale']['max']))
      || ($scope.criteria[criterion]['scale']['type'] == 'Categorical' && ($scope.new_action[$scope.criteria[criterion]['name']] > $scope.criteria[criterion]['scale']['num_categories'] || $scope.new_action[$scope.criteria[criterion]['name']] < 1))) {
        $('#new-action-criterion-' + $scope.criteria[criterion]['id']).addClass('has-error');
        can_add_action = false;
      }
      else
        $('#new-action-criterion-' + $scope.criteria[criterion]['id']).removeClass('has-error');
    }

    if(can_add_action) {
      if($scope.actions.length == 0)
        $scope.new_action.id = 1;
      else
        $scope.new_action.id = $scope.actions[$scope.actions.length - 1]['id'] + 1;

      $scope.actions.push(angular.copy($scope.new_action));

      //reset the new action input fields and remove the error classes - just in case
      $scope.new_action.name = '';
      $('#new-action-name').removeClass('has-error');

      for(criterion in $scope.criteria) {
        $scope.new_action[$scope.criteria[criterion]['name']] = '';
        $('#new-action-criterion-' + $scope.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurActionName = function(action) {
    if(action.name == '')
      $('#action-' + action.id + '-name').addClass('has-error');
    else
      $('#action-' + action.id + '-name').removeClass('has-error');
  }

  $scope.blurActionCriterion = function(action, criterion_name) {
    for(criterion in $scope.criteria)
      if($scope.criteria[criterion]['name'] == criterion_name) {
        if(($scope.criteria[criterion]['scale']['type'] == 'Numerical' && (action[criterion_name] < $scope.criteria[criterion]['scale']['min'] || action[criterion_name] > $scope.criteria[criterion]['scale']['max']))
        || ($scope.criteria[criterion]['scale']['type'] == 'Categorical' && (action[criterion_name] > $scope.criteria[criterion]['scale']['num_categories'] || action[criterion_name] < 1)))
          $('#action-' + action.id + '-criterion-' + $scope.criteria[criterion]['id']).addClass('has-error');
        else
          $('#action-' + action.id + '-criterion-' + $scope.criteria[criterion]['id']).removeClass('has-error');

        break;
      }
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

  $scope.new_category = {};

  $scope.addCategory = function() {
    var can_add_category = true;

    //if a name was not assigned to the new category - add error class
    if($scope.new_category.name == undefined || $scope.new_category.name == '') {
      $('#new-category-name').addClass('has-error');
      can_add_category = false;
    }
    else
      $('#new-category-name').removeClass('has-error');

    //if a membership degree was not assigned to the new category- add error class
    if($scope.new_category.membership_degree == undefined || $scope.new_category.membership_degree == '' || $scope.new_category.membership_degree < 0.5 || $scope.new_category.membership_degree > 1) {
      $('#new-category-membership-degree').addClass('has-error');
      can_add_category = false;
    }
    else
      $('#new-category-membership-degree').removeClass('has-error');

    //if a criterion value was not correctly assigned to the new category - add error class
    for(criterion in $scope.criteria) {
      if($scope.new_category[$scope.criteria[criterion]['name']] == undefined || $scope.new_category[$scope.criteria[criterion]['name']] == '' || $scope.new_category[$scope.criteria[criterion]['name']] < 0) {
        $('#new-category-' + $scope.criteria[criterion]['id']).addClass('has-error');
        can_add_category = false;
      }
      else
        $('#new-category-' + $scope.criteria[criterion]['id']).removeClass('has-error');
    }

    if(can_add_category){
      if($scope.categories.length == 0)
        $scope.new_category.id = 1;
      else
        $scope.new_category.id = $scope.categories[$scope.categories.length - 1].id + 1;

      $scope.new_category.reference_actions = [];
      $scope.categories.push(angular.copy($scope.new_category));

      //reset the input fields
      $scope.new_category.name = '';
      $('#new-category-name').removeClass('has-error');

      $scope.new_category.membership_degree = '';
      $('#new-category-membership-degree').removeClass('has-error');

      for(criterion in $scope.criteria) {
        $scope.new_category[$scope.criteria[criterion]['name']] = '';
        $('#new-category-' + $scope.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurCategoryName = function(category) {
    if(category.name == '')
      $('#category-' + category.id + '-name').addClass('has-error');
    else
      $('#category-' + category.id + '-name').removeClass('has-error');
  }

  $scope.blurCategoryMembership = function(category) {
    if(category.membership_degree == '' || category.membership_degree < 0.5 || category.membership_degree > 1)
      $('#category-' + category.id + '-membership-degree').addClass('has-error');
    else
      $('#category-' + category.id + '-membership-degree').removeClass('has-error');
  }

  $scope.blurCategoryCriterion = function(category, criterion) {
    if(category[criterion.name] == undefined || category[criterion.name] < 0)
      $('#category-' + category.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#category-' + category.id + '-criterion-' + criterion.id).removeClass('has-error');
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

  $scope.new_reference_action = {};

  $scope.addReferenceAction = function(category, index) {
    var can_add_reference = true;

    if($scope.new_reference_action[category.id] == undefined)
      $scope.new_reference_action[category.id] = {};

    //if a criterion value was not correctly assigned - add error class
    for(criterion in $scope.criteria) {
      if(($scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] == undefined || $scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] == "")
      || ($scope.criteria[criterion]['scale']['type'] == 'Numerical' && ($scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] < $scope.criteria[criterion]['scale']['min'] || $scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] > $scope.criteria[criterion]['scale']['max']))
      || ($scope.criteria[criterion]['scale']['type'] == 'Categorical' && ($scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] > $scope.criteria[criterion]['scale']['num_categories'] || $scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] < 1))) {
        $('#new-ref-' + category.id + '-criterion-' + $scope.criteria[criterion]['id']).addClass('has-error');
        can_add_reference = false;
      }
      else
        $('#new-ref-' + category.id + '-criterion-' + $scope.criteria[criterion]['id']).removeClass('has-error');
    }

    if(can_add_reference) {
      if($scope.categories[$scope.categories.indexOf(category)].reference_actions == undefined) {
        $scope.categories[$scope.categories.indexOf(category)].reference_actions = [];
        $scope.new_reference_action[category.id].id = 1;
      }
      else if($scope.categories[$scope.categories.indexOf(category)].reference_actions.length == 0)
        $scope.new_reference_action[category.id].id = 1;
      else
        $scope.new_reference_action[category.id].id = $scope.categories[$scope.categories.indexOf(category)].reference_actions[$scope.categories[$scope.categories.indexOf(category)].reference_actions.length - 1].id + 1;

      $scope.new_reference_action[category.id].name = 'b' + (index + 1) + ($scope.categories[$scope.categories.indexOf(category)].reference_actions.length + 1);

      $scope.categories[$scope.categories.indexOf(category)].reference_actions.push(angular.copy($scope.new_reference_action[category.id]));

      //reset the input fields
      $scope.new_reference_action[category.id].name = '';
      for(criterion in $scope.criteria) {
        $scope.new_reference_action[category.id][$scope.criteria[criterion]['name']] = '';
        $('#new-ref-' + category.id + '-criterion-' + $scope.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurReferenceAction = function(ref, category, criterion) {
    if((ref[criterion.name] == undefined || ref[criterion.name] == '')
    || (criterion['scale']['type'] == 'Numerical' && (ref[criterion.name] < criterion['scale']['min'] || ref[criterion.name] > criterion['scale']['max']))
    || (criterion['scale']['type'] == 'Categorical' && (ref[criterion.name] > criterion['scale']['num_categories'] || ref[criterion.name] < 1)))
      $('#ref-' + ref.id + '-' + category.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#ref-' + ref.id + '-' + category.id + '-criterion-' + criterion.id).removeClass('has-error');
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
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get the current project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //insert criteria
          response.data[proj]['criteria'] = $scope.criteria;
          //insert interaction effects
          response.data[proj]['interaction_effects'] = $scope.interaction_effects;
          //insert actions
          response.data[proj]['actions'] = $scope.actions;
          //insert categories
          response.data[proj]['categories'] = $scope.categories;

          //get the id of the document
          id_doc = response.data[proj]['_id'];
          //project to store in the db
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          showAlert('save-success');
        });
      });
    });
  }

  function getExecutions() {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the actions previously added
          $scope.executions = response.data[proj]['executions'];
          break;
        }
      }
    });
  }

  $scope.getResults = function() {
    //show loading button
    $scope.isLoading = true;

    var results = CATSDService.getResults($scope.criteria, $scope.interaction_effects, $scope.actions, $scope.categories);

    results.then(function(resolve) {

      $http.get('/projects').then(function(response) {
        //get current date
        var current_date = new Date();
        var execution_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear() + ' ' + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

        //if a comment has not been added
        if(typeof $scope.new_execution == 'undefined') {
          var comment = '';
        }
        else {
          var comment = $scope.new_execution.comment;
        }

        for(proj in response.data) {
          if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
            //get the largest execution_id
            if(response.data[proj]['executions'].length == 0) {
              var execution_id = 1;
            }
            else {
              var execution_id = response.data[proj]['executions'][response.data[proj]['executions'].length - 1]['execution_id'] + 1;
            }

            //insert execution into database
            response.data[proj]['executions'].push({'execution_id':execution_id,'criteria':$scope.criteria,'actions':$scope.actions,'categories':$scope.categories,'interaction_effects':$scope.interaction_effects,'results':resolve,'comment':comment,'execution_date':execution_date});
            //get the id of the document, so that it can be removed from the db
            id_doc = response.data[proj]['_id'];
            //project to store in the db
            proj_res = response.data[proj];
            delete proj_res['_id'];
            break;
          }
        }

        //delete the previous document with the list of projects
        $http.delete('/projects/' + id_doc).then(function() {
          //add the new list of projects
          $http.post('/projects', proj_res).then(function() {
            getExecutions();

            //reset the comment input field, if it was filled
            if(typeof $scope.new_execution != 'undefined')
              $scope.new_execution.comment = '';

            //hide loading button
            $scope.isLoading = false;
          });
        });
      });
    });
  }

  $scope.deleteExecution = function(execution) {
    $scope.deleteIdExecution = execution.execution_id;
  }

  $scope.confirmDeleteExecution = function(execution) {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          for(exec in response.data[proj]['executions']) {
            if(response.data[proj]['executions'][exec]['execution_id'] == execution.execution_id) {
              response.data[proj]['executions'].splice(exec, 1);
              //get the id of the document, so that it can be removed from the db
              id_doc = response.data[proj]['_id'];
              //project to store in the db
              proj_res = response.data[proj];
              delete proj_res['_id'];
              break;
            }
          }
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //refresh the list of projects
          getExecutions();
        });
      });
    });
  }

  $scope.cancelDeleteExecution = function() {
    $scope.deleteIdExecution = '';
  }

  $scope.deleteAllExecutions = function() {
    $scope.deleteIdExecution = 'all';
  }

  $scope.confirmDeleteAllExecutions = function() {
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          response.data[proj]['executions'] = [];
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //refresh the list of executions
          getExecutions();
          //reset delete variable
          $scope.deleteIdExecution = '';
        });
      });
    });
  }

  $scope.cancelDeleteAllExecutions = function() {
    $scope.deleteIdExecution = '';
  }

  $scope.changeSaveSuccess = function() {
    $scope.showSaveSuccess = false;
  }

  $scope.reloadData = function(alertShowing) {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          if(response.data[proj]['criteria'] != undefined)
            $scope.criteria = response.data[proj]['criteria'];

          if(response.data[proj]['interaction_effects'] != undefined)
            $scope.interaction_effects = response.data[proj]['interaction_effects'];

          if(response.data[proj]['actions'] != undefined)
            $scope.actions = response.data[proj]['actions'];

          if(response.data[proj]['categories'] != undefined)
            $scope.categories = response.data[proj]['categories'];

          if(alertShowing)
            showAlert('reload-success');

          break;
        }
      }
    });
  }

  $scope.confirmResetData = function() {
    $scope.criteria = [];
    $scope.interaction_effects = [];
    $scope.actions = [];
    $scope.categories = [];
    $scope.showResetData = false;
  }

  $scope.importData = function() {
    if(angular.element(document.querySelector('#import-criteria-check')).prop('checked')) {
      importFile('import-criteria-file');
    }
    if(angular.element(document.querySelector('#import-interaction-effects-check')).prop('checked')) {
      importFile('import-interaction-effects-file');
    }
    if(angular.element(document.querySelector('#import-scales-check')).prop('checked')) {
      importFile('import-scales-file');
    }
    if(angular.element(document.querySelector('#import-functions-check')).prop('checked')) {
      importFile('import-functions-file');
    }
    if(angular.element(document.querySelector('#import-actions-check')).prop('checked')) {
      importFile('import-actions-file');
    }
    if(angular.element(document.querySelector('#import-categories-check')).prop('checked')) {
      importFile('import-categories-file');
    }
    if(angular.element(document.querySelector('#import-reference-actions-check')).prop('checked')) {
      importFile('import-reference-actions-file');
    }
  }

  function importFile(input_id) {
    var file_input = document.getElementById(input_id);

    var reader = new FileReader();

    var data = [];

    //called when readAsText is performed
    reader.onload = (function(file) {
      var file_extension = file.name.split('.').pop();

      //imported file is a csv file
      if(file_extension == 'csv') {
        return function(e) {
          var rows = e.target.result.split("\n");

          for(row in rows)
            rows[row] = rows[row].trim();

          var columns = rows[0].split(";");

          //remove whitespaces and empty strings
          for(column in columns)
            columns[column] = columns[column].trim();

          for(var i = 1; i < rows.length; i++) {
            var cells = rows[i].split(";");
            var element = {};

            //add the unique id
            element['id'] = i;

            for(var j = 0; j < cells.length; j++)
              if(cells[j].trim() != '' && columns[j].trim() != '')
                element[columns[j]] = cells[j];

            if(!angular.equals(element, {}))
              data.push(element);
          }
          $scope.$apply(fileConverter(input_id, data));
        };
      }
      //imported file is a json file
      else if(file_extension == 'json') {
        return function(e) {
          var rows = e.target.result.split("\n");

          for(row in rows) {
            var element = JSON.parse(rows[row]);
            element['id'] = Number(row) + 1;
            data.push(element);
          }

          $scope.$apply(fileConverter(input_id,data));
        }
      }
    })(file_input.files[0]);

    //get the data from the file
    reader.readAsText(file_input.files[0]);
  }

  function fileConverter(input_id, data) {
    switch(input_id) {
      case 'import-criteria-file':
        $scope.criteria = data;
        break;

      case 'import-interaction-effects-file':
        for(item in data)
          data[item]['value'] = Number(data[item]['value']);

        $scope.interaction_effects = data;
        break;

      case 'import-scales-file':
        for(item in data) {
          for(criterion in $scope.criteria) {
            if(data[item]['criterion'] == $scope.criteria[criterion]['name']) {
              if($scope.criteria[criterion]['scale'] == undefined) {
                $scope.criteria[criterion]['scale'] = {};
              }
              if(data[item]['type'] == 'Numerical') {
                  $scope.criteria[criterion]['scale']['type'] = data[item]['type'];
                  $scope.criteria[criterion]['scale']['min'] = Number(data[item]['min']);
                  $scope.criteria[criterion]['scale']['max'] = Number(data[item]['max']);
              }
              else if(data[item]['type'] == 'Categorical') {
                $scope.criteria[criterion]['scale']['type'] = data[item]['type'];
                $scope.criteria[criterion]['scale']['num_categories'] = Number(data[item]['num_categories']);
              }
            }
          }
        }
        break;

      case 'import-functions-file':
        //variable to keep track of which criterion's branches have already been cleared
        var clear_array = [];
        for(item in data)
          clear_array[data[item]['criterion']] = false;

        for(item in data) {
          for(criterion in $scope.criteria) {
            if(data[item]['criterion'] == $scope.criteria[criterion]['name']) {
              if(!clear_array[data[item]['criterion']]) {
                $scope.criteria[criterion]['branches'] = [];
                clear_array[data[item]['criterion']] = true;
              }
              $scope.criteria[criterion]['branches'].push(data[item]);
            }
          }
        }
        break;

      case 'import-actions-file':
        for(action in data)
          for(field in data[action])
            if(field != 'name')
              data[action][field] = Number(data[action][field]);

        $scope.actions = data;
        break;

      case 'import-categories-file':
        for(category in data)
          for(field in data[category])
            if(field != 'name')
              data[category][field] = Number(data[category][field]);

        $scope.categories = data;
        break;

      case 'import-reference-actions-file':
        //variable to keep track of which categories' reference actions have already been cleared
        var clear_array = [];

        for(item in data)
          clear_array[data[item]['category']] = false;

        for(ref in data)
          for(field in data[ref])
            if(field != 'category')
              data[ref][field] = Number(data[ref][field]);

        for(item in data) {
          for(category in $scope.categories) {
            if(data[item]['category'] == $scope.categories[category]['name']) {
              if(!clear_array[data[item]['category']]) {
                $scope.categories[category]['reference_actions'] = [];
                clear_array[data[item]['category']] = true;
              }
              data[item]['name'] = 'b' + (Number(category) + 1) + ($scope.categories[category].reference_actions.length + 1);
              $scope.categories[category]['reference_actions'].push(data[item]);
            }
          }
        }
        break;
    }
  }

  $scope.exportData = function() {
    //export criteria to csv
    if(angular.element(document.querySelector('#export-criteria-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(criterion in $scope.criteria) {
        for(field in $scope.criteria[criterion])
          if(field != 'id' && field != 'branches' && field != 'scale' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(criterion in $scope.criteria) {
        for(field in $scope.criteria[criterion])
          if(field != 'id' && field != 'branches' && field != 'scale' && field != '$$hashKey')
            csv_str += $scope.criteria[criterion][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'criteria.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-criteria-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(criterion in $scope.criteria) {
        var json_element = {};
        for(field in $scope.criteria[criterion]) {
          if(field != 'id' && field != 'branches' && field != 'scale' && field != '$$hashKey')
            json_element[field] = $scope.criteria[criterion][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'criteria.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-interaction-effects-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(inter in $scope.interaction_effects) {
        for(field in $scope.interaction_effects[inter])
          if(field != 'id' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(inter in $scope.interaction_effects) {
        for(field in $scope.interaction_effects[inter])
          if(field != 'id' && field != '$$hashKey')
            csv_str += $scope.interaction_effects[inter][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'interaction_effects.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-interaction-effects-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(inter in $scope.interaction_effects) {
        var json_element = {};
        for(field in $scope.interaction_effects[inter]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.interaction_effects[inter][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'interaction_effects.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-scales-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'criterion;type;min;max;num_categories\n';

      for(criterion in $scope.criteria) {
        csv_str += $scope.criteria[criterion]['name'] + ';';

        csv_str += $scope.criteria[criterion]['scale']['type'] + ';';

        if($scope.criteria[criterion]['scale']['min'] != undefined)
          csv_str += $scope.criteria[criterion]['scale']['min'] + ';';
        else
          csv_str += '-;';

        if($scope.criteria[criterion]['scale']['max'] != undefined)
          csv_str += $scope.criteria[criterion]['scale']['max'] + ';';
        else
          csv_str += '-;';

        if($scope.criteria[criterion]['scale']['num_categories'] != undefined)
          csv_str += $scope.criteria[criterion]['scale']['num_categories'];
        else
          csv_str += '-';

        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'scales.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-scales-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(criterion in $scope.criteria) {
        var json_element = {};

        json_element['criterion'] = $scope.criteria[criterion]['name'];

        json_element['type'] = $scope.criteria[criterion]['scale']['type'];

        if($scope.criteria[criterion]['scale']['min'] != undefined)
          json_element['min'] = $scope.criteria[criterion]['scale']['min'] + ';';
        else
          json_element['min'] = '-;';

        if($scope.criteria[criterion]['scale']['max'] != undefined)
          json_element['max'] = $scope.criteria[criterion]['scale']['max'] + ';';
        else
          json_element['max'] = '-;';

        if($scope.criteria[criterion]['scale']['num_categories'] != undefined)
          json_element['num_categories'] = $scope.criteria[criterion]['scale']['num_categories'] + '';
        else
          json_element['num_categories'] = '-';

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'scales.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-functions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'criterion;function;condition\n';

      for(criterion in $scope.criteria) {
        for(branch in $scope.criteria[criterion]['branches']) {
          csv_str += $scope.criteria[criterion]['name'] + ';';
          csv_str += $scope.criteria[criterion]['branches'][branch]['function'] + ';';
          csv_str += $scope.criteria[criterion]['branches'][branch]['condition'];

          csv_str += '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'functions.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-functions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(criterion in $scope.criteria) {
        for(branch in $scope.criteria[criterion]['branches']) {
          var json_element = {};

          json_element['criterion'] = $scope.criteria[criterion]['name'];

          json_element['function'] = $scope.criteria[criterion]['branches'][branch]['function'];

          json_element['condition'] = $scope.criteria[criterion]['branches'][branch]['condition'];

          json_str += JSON.stringify(json_element) + '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'functions.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-actions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(action in $scope.actions) {
        for(field in $scope.actions[action])
          if(field != 'id' && field != '$$hashKey')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(action in $scope.actions) {
        for(field in $scope.actions[action])
          if(field != 'id' && field != '$$hashKey')
            csv_str += $scope.actions[action][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'actions.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-actions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(action in $scope.actions) {
        var json_element = {};

        for(field in $scope.actions[action]) {
          if(field != 'id' && field != '$$hashKey')
            json_element[field] = $scope.actions[action][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'actions.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-categories-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = '';

      for(category in $scope.categories) {
        for(field in $scope.categories[category])
          if(field != 'id' && field != '$$hashKey' && field != 'reference_actions')
            csv_str += field + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
        break;
      }

      for(category in $scope.categories) {
        for(field in $scope.categories[category])
          if(field != 'id' && field != '$$hashKey' && field != 'reference_actions')
            csv_str += $scope.categories[category][field] + ';';

        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'categories.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-categories-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(category in $scope.categories) {
        var json_element = {};

        for(field in $scope.categories[category]) {
          if(field != 'id' && field != '$$hashKey' && field != 'reference_actions')
            json_element[field] = $scope.categories[category][field];
        }

        json_str += JSON.stringify(json_element) + '\n';
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'categories.json';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-reference-actions-check')).prop('checked') && angular.element(document.querySelector('#csv-radio')).prop('checked')) {
      var csv_str = 'category;';

      for(category in $scope.categories) {
        for(ref in $scope.categories[category]['reference_actions']) {
          for(field in $scope.categories[category]['reference_actions'][ref]) {
            if(field != 'id' && field != '$$hashKey' && field != 'name' && field != 'category')
              csv_str += field + ';';
          }
          csv_str = csv_str.substring(0, csv_str.length - 1);
          csv_str += '\n';
          break;
        }
        break;
      }

      for(category in $scope.categories) {
        for(ref in $scope.categories[category]['reference_actions']) {
          csv_str += $scope.categories[category]['name'] + ';';
          for(field in $scope.categories[category]['reference_actions'][ref])
            if(field != 'id' && field != '$$hashKey' && field != 'name' && field != 'category')
              csv_str += $scope.categories[category]['reference_actions'][ref][field] + ';';

          csv_str = csv_str.substring(0, csv_str.length - 1);
          csv_str += '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'reference_actions.csv';
      hidden_element.click();
    }
    if(angular.element(document.querySelector('#export-reference-actions-check')).prop('checked') && angular.element(document.querySelector('#json-radio')).prop('checked')) {
      var json_str = '';

      for(category in $scope.categories) {
        var json_element = {};
        for(ref in $scope.categories[category]['reference_actions']) {
          json_element['category'] = $scope.categories[category]['name'];
          for(field in $scope.categories[category]['reference_actions'][ref]) {
            if(field != 'id' && field != '$$hashKey' && field != 'name')
              json_element[field] = $scope.categories[category]['reference_actions'][ref][field];
          }

          json_str += JSON.stringify(json_element) + '\n';
        }
      }

      var hidden_element = document.createElement('a');
      hidden_element.href = 'data:text/json;charset=utf-8,' + encodeURI(json_str);
      hidden_element.target = '_blank';
      hidden_element.download = 'reference_actions.json';
      hidden_element.click();
    }
  }

  $scope.selectAllImport = function() {
    document.getElementById('import-criteria-check').checked = true;
    document.getElementById('import-interaction-effects-check').checked = true;
    document.getElementById('import-scales-check').checked = true;
    document.getElementById('import-functions-check').checked = true;
    document.getElementById('import-actions-check').checked = true;
    document.getElementById('import-categories-check').checked = true;
    document.getElementById('import-reference-actions-check').checked = true;
  }

  $scope.selectNoneImport = function() {
    document.getElementById('import-criteria-check').checked = false;
    document.getElementById('import-interaction-effects-check').checked = false;
    document.getElementById('import-scales-check').checked = false;
    document.getElementById('import-functions-check').checked = false;
    document.getElementById('import-actions-check').checked = false;
    document.getElementById('import-categories-check').checked = false;
    document.getElementById('import-reference-actions-check').checked = false;
  }

  $scope.selectAllExport = function() {
    document.getElementById('export-criteria-check').checked = true;
    document.getElementById('export-interaction-effects-check').checked = true;
    document.getElementById('export-scales-check').checked = true;
    document.getElementById('export-functions-check').checked = true;
    document.getElementById('export-actions-check').checked = true;
    document.getElementById('export-categories-check').checked = true;
    document.getElementById('export-reference-actions-check').checked = true;
  }

  $scope.selectNoneExport = function() {
    document.getElementById('export-criteria-check').checked = false;
    document.getElementById('export-interaction-effects-check').checked = false;
    document.getElementById('export-scales-check').checked = false;
    document.getElementById('export-functions-check').checked = false;
    document.getElementById('export-actions-check').checked = false;
    document.getElementById('export-categories-check').checked = false;
    document.getElementById('export-reference-actions-check').checked = false;
  }

  $scope.showExecution = function(execution) {
    $scope.currentExecution = execution;
    $scope.compareExecution = '';
  }

  $scope.showCompareExecution = function(execution) {
    $scope.compareExecution = execution;
  }

  //check if criterion exists in criteria set of compareExecution
  $scope.compareCriteria = function(criterion) {
    if($scope.compareExecution == "")
      return false;

    for(criterion2 in $scope.currentExecution['criteria']) {
      if($scope.currentExecution['criteria'][criterion2]['name'] == criterion['name'])
        return false;
    }

    return true;
  }

  //update integratedSRFService variables
  $scope.updateIntegratedSRF = function() {
    $scope.integratedSRFService.addCriteria(angular.copy($scope.criteria));
    $scope.integratedSRFService.addCategories(angular.copy($scope.categories));


  }

  //check when the integrated SRF results are changed
  $scope.$watch('integratedSRFService.integrated_results', function() {
    if(Object.keys($scope.integratedSRFService.integrated_results).length > 0) {
      for(category in $scope.categories) {
        if($scope.categories[category]['name'] == $scope.integratedSRFService.integrated_category) {
          for(field in Object.keys($scope.integratedSRFService.integrated_results)) {
            $scope.categories[category][Object.keys($scope.integratedSRFService.integrated_results)[field]] = $scope.integratedSRFService.integrated_results[Object.keys($scope.integratedSRFService.integrated_results)[field]];
          }
          break;
        }
      }
    }
  });

  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
