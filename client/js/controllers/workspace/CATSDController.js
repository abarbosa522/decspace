app.controller('CATSDController', function($scope) {

  /*** DATA INPUT FUNCTIONS ***/

  //add a new criterion
  $scope.addCATCriterion = function() {
    var can_add_criterion = true;

    //if a name has not been assigned to the new criterion - add error class
    if($scope.new_cat_criterion.name == undefined || $scope.new_cat_criterion.name == '') {
      $('#new-cat-criterion-name').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-cat-criterion-name').removeClass('has-error');

    //if a direction has not been assigned to the new criterion - add error class
    if($scope.new_cat_criterion.direction == undefined || $scope.new_cat_criterion.direction == '') {
      $('#new-cat-criterion-direction').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-cat-criterion-direction').removeClass('has-error');

    if(can_add_criterion){
      //assign an unique id to the new criterion
      if($scope.currentModule.input.criteria.length == 0)
        $scope.new_cat_criterion.id = 1;
      else
        $scope.new_cat_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1]['id'] + 1;

      //add the new criterion to the
      $scope.currentModule.input.criteria.push(angular.copy($scope.new_cat_criterion));

      //add a new scale
      var new_cat_scale = {
        'id' : $scope.new_cat_criterion.id,
        'criterion' : $scope.new_cat_criterion.name,
        'criterion_id' : $scope.new_cat_criterion.id,
        'type' : '',
        'min' : '',
        'max' : '',
        'num_categories' : ''
      };

      $scope.currentModule.input.scales.push(new_cat_scale);

      //reset the criterion input fields
      $scope.new_cat_criterion.name = '';
      $scope.new_cat_criterion.direction = '';

      //remove all error classes - just be sure
      $('#new-cat-criterion-name').removeClass('has-error');
      $('#new-cat-criterion-direction').removeClass('has-error');
    }
  }

  $scope.blurCATCriterionName = function(criterion) {
    if(criterion.name == '')
      $('#cat-criterion-' + criterion.id + '-name').addClass('has-error');
    else {
      $('#cat-criterion-' + criterion.id + '-name').removeClass('has-error');
      
      //update the name of the criterion in the scale
      for(scale in $scope.currentModule.input.scales)
        if($scope.currentModule.input.scales[scale].criterion_id == criterion.id)
          $scope.currentModule.input.scales[scale].criterion = criterion.name
    }
  }

  $scope.addCATInteractionEffect = function() {
    var can_add_interaction = true;

    //if a type of effect was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.type == undefined) {
      $('#new-cat-interaction-type').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-cat-interaction-type').removeClass('has-error');

    //if the first criterion was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.criterion1 == undefined) {
      $('#new-cat-interaction-criterion1').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-cat-interaction-criterion1').removeClass('has-error');

    //if the second criterion was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.criterion2 == undefined) {
      $('#new-cat-interaction-criterion2').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-cat-interaction-criterion2').removeClass('has-error');

    //if the category was not assigned to the new interaction - add error class
    if($scope.new_interaction_effect.category == undefined) {
      $('#new-cat-interaction-category').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-cat-interaction-category').removeClass('has-error');

    //if a value was not correctly assigned to the new interaction - add error class
    if(($scope.new_interaction_effect.value == undefined || $scope.new_interaction_effect.value == '')
    || (($scope.new_interaction_effect.type == 'Mutual-Strengthening Effect' && $scope.new_interaction_effect.value <= 0)
    || (($scope.new_interaction_effect.type == 'Mutual-Weakening Effect' || $scope.new_interaction_effect.type == 'Antagonistic Effect') && $scope.new_interaction_effect.value >= 0))) {
      $('#new-cat-interaction-value').addClass('has-error');
      can_add_interaction = false;
    }
    else
      $('#new-cat-interaction-value').removeClass('has-error');

    if(can_add_interaction){
      if($scope.currentModule.input['interaction effects'].length == 0)
        $scope.new_interaction_effect.id = 1;
      else
        $scope.new_interaction_effect.id = $scope.currentModule.input['interaction effects'][$scope.currentModule.input['interaction effects'].length - 1].id + 1;

      $scope.currentModule.input['interaction effects'].push(angular.copy($scope.new_interaction_effect));

      //reset the input fields
      $scope.new_interaction_effect.type = '';
      $scope.new_interaction_effect.criterion1 = '';
      $scope.new_interaction_effect.criterion2 = '';
      $scope.new_interaction_effect.category = '';
      $scope.new_interaction_effect.value = '';

      //remove all error classes
      $('#new-cat-interaction-type').removeClass('has-error');
      $('#new-cat-interaction-criterion1').removeClass('has-error');
      $('#new-cat-interaction-criterion2').removeClass('has-error');
      $('#new-cat-interaction-category').removeClass('has-error');
      $('#new-cat-interaction-value').removeClass('has-error');
    }
  }

  $scope.blurCATInteractionValue = function(interaction) {
    if(interaction.value == '' || ((interaction.type == 'Mutual-Strengthening Effect' && interaction.value <= 0)
    || ((interaction.type == 'Mutual-Weakening Effect' || interaction.type == 'Antagonistic Effect') && interaction.value >= 0)))
      $('#cat-interaction-' + interaction.id + '-value').addClass('has-error');
    else
      $('#cat-interaction-' + interaction.id + '-value').removeClass('has-error');
  }

  $scope.blurCATScaleType = function(scale) {
    if(scale.type == '' || scale.type == undefined)
      $('#cat-scale-' + scale.id + '-type').addClass('has-error');
    else
      $('#cat-scale-' + scale.id + '-type').removeClass('has-error');
  }

  $scope.disableCATScaleOrdinal = function(scale) {
    if(scale.type == 'Ordinal')
      return false;
    else {
      scale.min = '';
      scale.max = '';
      return true;
    }
  }

  $scope.disableCATScaleCardinal = function(scale) {
    if(scale.type == 'Cardinal')
      return false;
    else {
      scale.num_categories = '';
      return true;
    }
  }

  $scope.blurCATScaleMin = function(scale) {
    if(scale.min == undefined)
      $('#cat-scale-' + scale.id + '-min').addClass('has-error');
    else if(scale.min >= scale.max && scale.min != undefined && scale.max != undefined) {
      $('#cat-scale-' + scale.id + '-min').addClass('has-error');
      $('#cat-scale-' + scale.id + '-max').addClass('has-error');
    }
    else {
      $('#cat-scale-' + scale.id + '-min').removeClass('has-error');
      $('#cat-scale-' + scale.id + '-max').removeClass('has-error');
    }
  }

  $scope.blurCATScaleMax = function(scale) {
    if(scale.max == undefined)
      $('#cat-scale-' + scale.id + '-max').addClass('has-error');
    else if(scale.min >= scale.max && scale.min != undefined && scale.max != undefined) {
      $('#cat-scale-' + scale.id + '-min').addClass('has-error');
      $('#cat-scale-' + scale.id + '-max').addClass('has-error');
    }
    else {
      $('#cat-scale-' + scale.id + '-min').removeClass('has-error');
      $('#cat-scale-' + scale.id + '-max').removeClass('has-error');
    }
  }

  $scope.blurCATScaleCategories = function(scale) {
    if(scale.num_categories < 2 || scale.num_categories == undefined)
      $('#cat-scale-' + scale.id + '-categories').addClass('has-error');
    else
      $('#cat-scale-' + scale.id + '-categories').removeClass('has-error');
  }

  $scope.addCATBranch = function(criterion) {
    var can_add_branch = true;

    //if a function was not assigned - add error class
    if($scope.new_branch[criterion.id].function == undefined || $scope.new_branch[criterion.id].function == '') {
      $('#new-cat-branch-function-' + criterion.id).addClass('has-error');
      can_add_branch = false;
    }
    else
      $('#new-cat-branch-function-' + criterion.id).removeClass('has-error');

    //if a condition was not assigned - add error class
    if($scope.new_branch[criterion.id].condition == undefined || $scope.new_branch[criterion.id].condition == '') {
      $('#new-cat-branch-condition-' + criterion.id).addClass('has-error');
      can_add_branch = false;
    }
    else
      $('#new-cat-branch-condition-' + criterion.id).removeClass('has-error');

    if(can_add_branch) {
      if($scope.currentModule.input.functions.length == 0)
        $scope.new_branch[criterion.id].id = 1;
      else
        $scope.new_branch[criterion.id].id = $scope.currentModule.input.functions[$scope.currentModule.input.functions.length - 1].id + 1;

      $scope.new_branch[criterion.id].criterion = criterion.name;

      $scope.currentModule.input.functions.push(angular.copy($scope.new_branch[criterion.id]));

      //reset input fields
      $scope.new_branch[criterion.id].function = '';
      $scope.new_branch[criterion.id].condition = '';

      //remove all error classes
      $('#new-cat-branch-function-' + criterion.id).removeClass('has-error');
      $('#new-cat-branch-condition-' + criterion.id).removeClass('has-error');
    }
  }

  $scope.blurCATBranchFunction = function(branch, criterion) {
    if(branch.function == '' || branch.function == undefined)
      $('#cat-branch-' + branch.id + '-function-' + criterion.id).addClass('has-error');
    else
      $('#cat-branch-' + branch.id + '-function-' + criterion.id).removeClass('has-error');
  }

  $scope.blurCATBranchCondition = function(branch, criterion) {
    if(branch.condition == '' || branch.condition == undefined)
      $('#cat-branch-' + branch.id + '-condition-' + criterion.id).addClass('has-error');
    else
      $('#cat-branch-' + branch.id + '-condition-' + criterion.id).removeClass('has-error');
  }

  $scope.addCATAction = function() {
    var can_add_action = true;

    //if a name was not assigned to the new action - add error class
    if($scope.new_cat_action.name == undefined || $scope.new_cat_action.name == '') {
      $('#new-cat-action-name').addClass('has-error');
      can_add_action = false;
    }
    else
      $('#new-cat-action-name').removeClass('has-error');

    //if the criterion field has not been assigned - add error class
    for(criterion in $scope.currentModule.input.criteria) {
      var crt_scale;

      for(scale in $scope.currentModule.input.scales)
        if($scope.currentModule.input.scales[scale].criterion == $scope.currentModule.input.criteria[criterion].name)
          crt_scale = $scope.currentModule.input.scales[scale];

      if(($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] == "")
      || (crt_scale.type == 'Ordinal' && ($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] < crt_scale.min || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] > crt_scale.max))
      || (crt_scale.type == 'Cardinal' && ($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] > crt_scale.num_categories || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] < 1))) {
        $('#new-cat-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        can_add_action = false;
      }
      else
        $('#new-cat-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
    }

    if(can_add_action) {
      if($scope.currentModule.input.actions.length == 0)
        $scope.new_cat_action.id = 1;
      else
        $scope.new_cat_action.id = $scope.currentModule.input.actions[$scope.currentModule.input.actions.length - 1]['id'] + 1;

      $scope.currentModule.input.actions.push(angular.copy($scope.new_cat_action));

      //reset the new action input fields and remove the error classes - just in case
      $scope.new_cat_action.name = '';
      $('#new-cat-action-name').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-cat-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurCATActionName = function(action) {
    if(action.name == '')
      $('#cat-action-' + action.id + '-name').addClass('has-error');
    else
      $('#cat-action-' + action.id + '-name').removeClass('has-error');
  }

  $scope.blurCATActionCriterion = function(action, criterion_name) {
    for(criterion in $scope.currentModule.input.criteria)
      if($scope.currentModule.input.criteria[criterion].name == criterion_name) {
        //get the criterion's scale
        var crt_scale;

        for(scale in $scope.currentModule.input.scales)
          if($scope.currentModule.input.scales[scale].criterion == $scope.currentModule.input.criteria[criterion].name)
            crt_scale = $scope.currentModule.input.scales[scale];
        
        if((crt_scale.type == 'Ordinal' && (action[criterion_name] < crt_scale.min || action[criterion_name] > crt_scale.max))
        || (crt_scale.type == 'Cardinal' && (action[criterion_name] > crt_scale.num_categories || action[criterion_name] < 1)))
          $('#cat-action-' + action.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        else
          $('#cat-action-' + action.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');

        break;
      }
  }

  $scope.addCATCategory = function() {
    var can_add_category = true;

    //if a name was not assigned to the new category - add error class
    if($scope.new_category.name == undefined || $scope.new_category.name == '') {
      $('#new-cat-category-name').addClass('has-error');
      can_add_category = false;
    }
    else
      $('#new-cat-category-name').removeClass('has-error');

    //if a membership degree was not assigned to the new category- add error class
    if($scope.new_category.membership_degree == undefined || $scope.new_category.membership_degree == '' || $scope.new_category.membership_degree < 0.5 || $scope.new_category.membership_degree > 1) {
      $('#new-cat-category-membership-degree').addClass('has-error');
      can_add_category = false;
    }
    else
      $('#new-cat-category-membership-degree').removeClass('has-error');

    //if a criterion value was not correctly assigned to the new category - add error class
    for(criterion in $scope.currentModule.input.criteria) {
      if($scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] == "" || $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] < 0) {
        $('#new-cat-category-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        can_add_category = false;
      }
      else
        $('#new-cat-category-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
    }

    if(can_add_category){
      if($scope.currentModule.input.categories.length == 0)
        $scope.new_category.id = 1;
      else
        $scope.new_category.id = $scope.currentModule.input.categories[$scope.currentModule.input.categories.length - 1].id + 1;
      
      $scope.currentModule.input.categories.push(angular.copy($scope.new_category));

      //reset the input fields
      $scope.new_category.name = '';
      $('#new-cat-category-name').removeClass('has-error');

      $scope.new_category.membership_degree = '';
      $('#new-cat-category-membership-degree').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-cat-category-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurCATCategoryName = function(category) {
    if(category.name == '')
      $('#cat-category-' + category.id + '-name').addClass('has-error');
    else
      $('#cat-category-' + category.id + '-name').removeClass('has-error');
  }

  $scope.blurCATCategoryMembership = function(category) {
    if(category.membership_degree == '' || category.membership_degree < 0.5 || category.membership_degree > 1)
      $('#cat-category-' + category.id + '-membership-degree').addClass('has-error');
    else
      $('#cat-category-' + category.id + '-membership-degree').removeClass('has-error');
  }

  $scope.blurCATCategoryCriterion = function(category, criterion) {
    if(category[criterion.name] == undefined || category[criterion.name] < 0)
      $('#cat-category-' + category.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#cat-category-' + category.id + '-criterion-' + criterion.id).removeClass('has-error');
  }

  $scope.addCATReferenceAction = function(category) {
    var can_add_reference = true;

    //if a criterion value was not correctly assigned - add error class
    for(criterion in $scope.currentModule.input.criteria) {
      var crt_scale;

      for(scale in $scope.currentModule.input.scales)
        if($scope.currentModule.input.scales[scale].criterion == $scope.currentModule.input.criteria[criterion].name)
          crt_scale = $scope.currentModule.input.scales[scale];
        
      if(($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] == "")
      || (crt_scale.type == 'Ordinal' && ($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] < crt_scale.min || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] > crt_scale.max))
      || (crt_scale.type == 'Cardinal' && ($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] > crt_scale.num_categories || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] < 1))) {
        $('#new-cat-ref-' + category.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        can_add_reference = false;
      }
      else
        $('#new-cat-ref-' + category.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
    }

    if(can_add_reference) {
      if($scope.currentModule.input['reference actions'].length == 0)
        $scope.new_reference_action[category.id].id = 1;
      else
        $scope.new_reference_action[category.id].id = $scope.currentModule.input['reference actions'][$scope.currentModule.input['reference actions'].length - 1].id + 1;
      
      //count the number of added reference actions to category
      var num_ref_category = 1;
      
      for(ref in $scope.currentModule.input['reference actions'])
        if($scope.currentModule.input['reference actions'][ref].category == category.name)
          num_ref_category++;
        
      //add the name of the reference action
      $scope.new_reference_action[category.id].name = 'b' + ($scope.currentModule.input.categories.indexOf(category) + 1) + num_ref_category;
      
      //add the category name to the reference action
      $scope.new_reference_action[category.id].category = category.name;
      
      //add the reference action to the module data
      $scope.currentModule.input['reference actions'].push(angular.copy($scope.new_reference_action[category.id]));

      //reset the input fields
      $scope.new_reference_action[category.id].name = '';
      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-cat-ref-' + category.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }
  
  $scope.getCategoryReferenceActions = function(category) {
    var ref_actions = [];
    
    for(ref in $scope.currentModule.input['reference actions'])
      if($scope.currentModule.input['reference actions'][ref].category == category)
        ref_actions.push($scope.currentModule.input['reference actions'][ref]);
    
    return ref_actions;
  }
  
  $scope.blurCATReferenceAction = function(ref, category, criterion) {
    var crt_scale;

    for(scale in $scope.currentModule.input.scales)
      if($scope.currentModule.input.scales[scale].criterion == criterion.name)
        crt_scale = $scope.currentModule.input.scales[scale];

    if((ref[criterion.name] == undefined || ref[criterion.name] == "")
    || (crt_scale.type == 'Ordinal' && (ref[criterion.name] < crt_scale.min || ref[criterion.name] > crt_scale.max))
    || (crt_scale.type == 'Cardinal' && (ref[criterion.name] > crt_scale.num_categories || ref[criterion.name] < 1)))
      $('#cat-ref-' + ref.id + '-' + category.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#cat-ref-' + ref.id + '-' + category.id + '-criterion-' + criterion.id).removeClass('has-error');
  }
});
